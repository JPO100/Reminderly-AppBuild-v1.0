import AppIntents
import JavaScriptCore
import UIKit
import UserNotifications
import WidgetKit

// Siri locked-device creation (docs/plans/siri-locked-device.md). The intent runs in the background on every iOS
// version, also with the iPhone locked, and never opens Reminderly:
// 1. refuses when Siri is off in Reminderly (fails closed, docs/plans/siri-off-refusal.md)
// 2. builds the reminder with Reminderly's own parsing (siri-core.js in JavaScriptCore); an explicit time off the
//    quarter hour is refused with a spoken explanation and nothing is saved; a date with no time makes Siri ask
//    "What time?" and nothing is saved without one (docs/plans/no-auto-time.md)
// 3. saves it to the App Group pending list and reads it back; the app imports it by id when it next runs
// 4. schedules its notification exactly as the Capacitor plugin would, with badges per src/app/utils/siri-badge.ts
// 5. updates the lock screen widget, then says "Okay, that's added"
@available(iOS 16.0, *)
struct AddReminderIntent: AppIntent {
    static var title: LocalizedStringResource = "Add to Reminderly"
    static var description = IntentDescription("Create a reminder in Reminderly using natural language")
    static var openAppWhenRun: Bool = false
    static var authenticationPolicy: IntentAuthenticationPolicy = .alwaysAllowed

    @available(iOS 26.0, *)
    static var supportedModes: IntentModes { [.background] }

    @Parameter(title: "Reminder text")
    var text: String?

    @Parameter(title: "Time")
    var timeText: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard await SiriStore.siriActive() else { throw SiriOffError() }

        var reminderText = text ?? ""
        if reminderText.isEmpty {
            reminderText = try await $text.requestValue("What would you like to be reminded about?") ?? ""
        }
        guard !reminderText.isEmpty else { throw SiriNotConfirmedError() }

        // A date with no time: ask for one and parse it with the request, before anything is saved
        if try await SiriReminderCreator.needsTime(text: reminderText) {
            var answer = try await $timeText.requestValue("What time?") ?? ""
            answer = answer.trimmingCharacters(in: .whitespacesAndNewlines)
            // "cancel", "stop", "never mind", "forget it": nothing is saved (docs/plans/no-auto-time.md)
            if SiriCore.isCancelAnswer(answer) { return .result(dialog: "Okay, cancelled.") }
            if answer.lowercased().hasPrefix("at ") { answer = String(answer.dropFirst(3)) }
            guard !answer.isEmpty else { throw SiriNeedsTimeError() }
            reminderText = "\(reminderText) at \(answer)"
        }

        try await SiriReminderCreator.create(text: reminderText)
        return .result(dialog: "Okay, that's added")
    }
}

// Siri runs one conversation at a time, so a run that starts while another is in progress is Siri retrying the same
// request: it waits for that run and shares its result instead of adding a second reminder.
@available(iOS 16.0, *)
@MainActor
enum SiriReminderCreator {
    private static var inFlight: Task<Void, Error>?

    // Whether the text has a date but no time (buildSiriReminder's needsTime); an unsupported time throws as usual
    static func needsTime(text: String) throws -> Bool {
        guard let context = SiriStore.context() else { throw SiriNotConfirmedError() }
        let object = try SiriCore.parse(text: text, now: Date(), repeatsActive: context.repeatsActive)
        return object["needsTime"] as? Bool == true
    }

    static func create(text: String) async throws {
        if let running = inFlight { return try await running.value }
        let task = Task { @MainActor in try await createNow(text: text) }
        inFlight = task
        defer { inFlight = nil }
        try await task.value
    }

    private static func createNow(text: String) async throws {
        guard var context = SiriStore.context() else { throw SiriNotConfirmedError() }
        let now = Date()

        var reminder = try SiriCore.buildReminder(text: text, now: now, repeatsActive: context.repeatsActive)
        let reminderId = UUID().uuidString.lowercased()
        reminder["id"] = reminderId
        reminder["createdAt"] = Int64(now.timeIntervalSince1970 * 1000)

        try SiriStore.appendPending(reminder)
        context.badgeTimeline = try await SiriNotifications.add(reminder: reminder, reminderId: reminderId, context: context, now: now)
        SiriStore.saveContext(context)
        SiriWidget.add(reminder: reminder, now: now)
    }
}

// What the app publishes (siri-pending.ts) and the pending list it imports. Main thread only, as the app's bridge.
@available(iOS 16.0, *)
@MainActor
enum SiriStore {
    struct Context: Codable {
        var alerts: Bool
        var sound: Bool
        var badge: Bool
        var includeToday: Bool
        var repeatsActive: Bool
        var badgeTimeline: [Int64]
    }

    private static var defaults: UserDefaults? { UserDefaults(suiteName: "group.com.reminderly.app") }

    // Only a stored true accepts a request
    static func siriActive() -> Bool { defaults?.object(forKey: "siriRemindersActive") as? Bool == true }

    static func context() -> Context? {
        guard let json = defaults?.string(forKey: "siriContext") else { return nil }
        return try? JSONDecoder().decode(Context.self, from: Data(json.utf8))
    }

    // Keeps the badge timeline current for a further Siri request before the app runs
    static func saveContext(_ context: Context) {
        guard let data = try? JSONEncoder().encode(context), let json = String(data: data, encoding: .utf8) else { return }
        defaults?.set(json, forKey: "siriContext")
    }

    static func appendPending(_ reminder: [String: Any]) throws {
        guard let defaults,
              let data = try? JSONSerialization.data(withJSONObject: reminder),
              let json = String(data: data, encoding: .utf8) else { throw SiriNotConfirmedError() }
        defaults.set((defaults.stringArray(forKey: "siriPendingReminders") ?? []) + [json], forKey: "siriPendingReminders")
        // Saved only if it reads back
        guard defaults.stringArray(forKey: "siriPendingReminders")?.contains(json) == true else { throw SiriNotConfirmedError() }
    }
}

// Reminderly's own Siri parsing (buildSiriReminder in src/app/utils/siri.ts), bundled as siri-core.js
@available(iOS 16.0, *)
enum SiriCore {
    // A reminder to save: a date with no time is refused here too, so it can never be saved without one
    static func buildReminder(text: String, now: Date, repeatsActive: Bool) throws -> [String: Any] {
        let object = try parse(text: text, now: now, repeatsActive: repeatsActive)
        if object["needsTime"] as? Bool == true { throw SiriNeedsTimeError() }
        return object
    }

    // Whether an answer to "What time?" cancels (isSiriCancelAnswer in src/app/utils/siri.ts)
    static func isCancelAnswer(_ answer: String) -> Bool {
        guard let url = Bundle.main.url(forResource: "siri-core", withExtension: "js"),
              let script = try? String(contentsOf: url, encoding: .utf8),
              let js = JSContext() else { return false }
        js.evaluateScript(script)
        js.setObject(answer, forKeyedSubscript: "siriAnswer" as NSString)
        return js.evaluateScript("ReminderlySiri.isSiriCancelAnswer(siriAnswer)")?.toBool() ?? false
    }

    static func parse(text: String, now: Date, repeatsActive: Bool) throws -> [String: Any] {
        guard let url = Bundle.main.url(forResource: "siri-core", withExtension: "js"),
              let script = try? String(contentsOf: url, encoding: .utf8),
              let js = JSContext() else { throw SiriNotConfirmedError() }
        var failed = false
        js.exceptionHandler = { _, _ in failed = true }
        js.evaluateScript(script)
        js.setObject(text, forKeyedSubscript: "siriText" as NSString)
        js.setObject(repeatsActive, forKeyedSubscript: "siriRepeats" as NSString)
        let millis = Int64(now.timeIntervalSince1970 * 1000)
        let json = js.evaluateScript("JSON.stringify(ReminderlySiri.buildSiriReminder(siriText, new Date(\(millis)), siriRepeats))")?.toString()
        guard !failed, let json,
              let object = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any] else { throw SiriNotConfirmedError() }
        // An explicit time off the quarter hour: nothing is saved or scheduled, Siri explains instead
        if let unsupported = object["unsupportedTime"] as? [String: Any] {
            throw SiriUnsupportedTimeError(earlier: unsupported["earlier"] as? String ?? "", later: unsupported["later"] as? String ?? "")
        }
        return object
    }
}

// The new reminder's notification and the badge change, ported line by line from addReminderToScheduled
// (src/app/utils/siri-badge.ts), with requests shaped as LocalNotificationsPlugin shapes them. The app's own sync
// stays the notification engine: when it next runs it finds these requests identical and leaves them.
@available(iOS 16.0, *)
@MainActor
enum SiriNotifications {
    static let midnightBadgeFirstId = 2_147_483_641
    static let maxScheduled = 64

    // notificationIdForReminder in notifications.ts
    static func notificationId(for reminderId: String) -> Int {
        reminderId.reduce(1) { acc, char in (acc * 31 + Int(String(char).utf16.first ?? 0)) % midnightBadgeFirstId }
    }

    private static func localDate(_ date: String, plusDays: Int = 0, hour: Int = 0, minute: Int = 0) -> Date? {
        let parts = date.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2] + plusDays, hour: hour, minute: minute))
    }

    private static func millis(_ date: Date) -> Int64 { Int64((date.timeIntervalSince1970 * 1000).rounded()) }

    // badgeCountsFrom: start of its day with include today; due time + 1ms when timed; next midnight when date-only
    static func badgeCountsFrom(schedule: [String: Any], includeToday: Bool) -> Int64? {
        guard schedule["kind"] as? String == "scheduled", let date = schedule["date"] as? String else { return nil }
        if includeToday { return localDate(date).map(millis) }
        if let time = schedule["time"] as? String {
            let hm = time.split(separator: ":").compactMap { Int($0) }
            guard hm.count == 2 else { return nil }
            return localDate(date, hour: hm[0], minute: hm[1]).map { millis($0) + 1 }
        }
        return localDate(date, plusDays: 1).map(millis)
    }

    static func badgeCount(_ timeline: [Int64], at: Int64) -> Int { timeline.filter { $0 <= at }.count }

    private struct Scheduled {
        let identifier: String
        let isMidnight: Bool
        let at: Date
        var content: UNMutableNotificationContent
        var changed: Bool
        let isNew: Bool
    }

    /// Schedules the reminder's notification and adjusts the badges; returns the updated badge timeline.
    static func add(reminder: [String: Any], reminderId: String, context: SiriStore.Context, now: Date) async throws -> [Int64] {
        let schedule = reminder["schedule"] as? [String: Any] ?? [:]
        let from = badgeCountsFrom(schedule: schedule, includeToday: context.includeToday)
        let timeline = from.map { (context.badgeTimeline + [$0]).sorted() } ?? context.badgeTimeline

        let center = UNUserNotificationCenter.current()
        let status = await center.notificationSettings().authorizationStatus
        guard [.authorized, .provisional, .ephemeral].contains(status), context.alerts || context.badge else { return timeline }

        // 1. Pending notifications that fire once the reminder counts gain one on their badge
        var items: [Scheduled] = []
        for request in await center.pendingNotificationRequests() {
            guard let trigger = request.trigger as? UNTimeIntervalNotificationTrigger, let at = trigger.nextTriggerDate(),
                  let content = request.content.mutableCopy() as? UNMutableNotificationContent else { continue }
            var item = Scheduled(identifier: request.identifier, isMidnight: (Int(request.identifier) ?? 0) >= midnightBadgeFirstId,
                                 at: at, content: content, changed: false, isNew: false)
            if context.badge, let from, millis(at) + 1 >= from {
                let badge = (content.badge?.intValue ?? 0) + 1
                item.content.badge = NSNumber(value: badge)
                if var extra = content.userInfo["cap_extra"] as? [String: Any], (extra["reminderId"] as? String ?? "") != "" {
                    extra["badgeDeltaOnAction"] = badge > 0 ? 1 : 0
                    item.content.userInfo["cap_extra"] = extra
                }
                item.changed = true
            }
            items.append(item)
        }

        // 2. The reminder's own notification, when it has a future time
        if let time = schedule["time"] as? String, let date = schedule["date"] as? String {
            let hm = time.split(separator: ":").compactMap { Int($0) }
            if hm.count == 2, let at = localDate(date, hour: hm[0], minute: hm[1]), at > now {
                let badge = context.badge ? badgeCount(timeline, at: millis(at) + 1) : 0
                let content = UNMutableNotificationContent()
                let alert = context.alerts
                content.title = NSString.localizedUserNotificationString(forKey: alert ? "Reminderly" : "", arguments: nil)
                content.body = NSString.localizedUserNotificationString(forKey: alert ? (reminder["displayText"] as? String ?? "") : "", arguments: nil)
                content.userInfo = [
                    "cap_extra": ["reminderId": alert ? reminderId : "", "badgeDeltaOnAction": alert && badge > 0 ? 1 : 0],
                    "cap_schedule": ["at": at],
                ]
                content.badge = NSNumber(value: badge)
                content.categoryIdentifier = alert ? "reminder-actions" : ""
                if alert && context.sound { content.sound = UNNotificationSound(named: UNNotificationSoundName("default")) }
                items.append(Scheduled(identifier: "\(notificationId(for: reminderId))", isMidnight: false, at: at,
                                       content: content, changed: true, isNew: true))
            }
        }

        // 3. The 64 limit: reminder notifications first (earliest; the new one after equal times), midnights after
        let reminderItems = items.enumerated().filter { !$0.element.isMidnight }
            .sorted { $0.element.at == $1.element.at ? $0.offset < $1.offset : $0.element.at < $1.element.at }
            .map(\.element)
        let kept = Array(reminderItems.prefix(maxScheduled))
        let midnights = items.filter(\.isMidnight).sorted { $0.at < $1.at }
        let keptMidnights = Array(midnights.prefix(max(0, maxScheduled - kept.count)))
        let dropped = (reminderItems.dropFirst(maxScheduled) + midnights.dropFirst(keptMidnights.count)).filter { !$0.isNew }
        center.removePendingNotificationRequests(withIdentifiers: dropped.map(\.identifier))

        // Re-added requests keep their original time: the interval is measured from now
        for item in (kept + keptMidnights) where item.changed {
            let interval = item.at.timeIntervalSince(Date())
            guard interval > 0 else { continue }
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
            try await center.add(UNNotificationRequest(identifier: item.identifier, content: item.content, trigger: trigger))
        }

        if context.badge { try? await center.setBadgeCount(badgeCount(timeline, at: millis(now))) }
        return timeline
    }
}

// The lock screen widget snapshot (getTodayProgress in reminder-utils.ts), when it is for today
@available(iOS 16.0, *)
@MainActor
enum SiriWidget {
    static func add(reminder: [String: Any], now: Date) {
        guard let defaults = UserDefaults(suiteName: "group.com.reminderly.app"),
              var snapshot = defaults.dictionary(forKey: "todayProgress"),
              let schedule = reminder["schedule"] as? [String: Any], schedule["kind"] as? String == "scheduled",
              let date = schedule["date"] as? String else { return }
        let format = DateFormatter()
        format.locale = Locale(identifier: "en_US_POSIX")
        format.dateFormat = "yyyy-MM-dd"
        let today = format.string(from: now)
        guard snapshot["date"] as? String == today,
              let tomorrowDate = Calendar.current.date(byAdding: .day, value: 1, to: now) else { return }
        if date <= today {
            snapshot["outstanding"] = (snapshot["outstanding"] as? Int ?? 0) + 1
        } else if date == format.string(from: tomorrowDate) {
            snapshot["dueTomorrow"] = (snapshot["dueTomorrow"] as? Int ?? 0) + 1
        } else {
            return
        }
        defaults.set(snapshot, forKey: "todayProgress")
        WidgetCenter.shared.reloadAllTimelines()
    }
}

// Siri speaks the error's text and ends
@available(iOS 16.0, *)
struct SiriOffError: Error, CustomLocalizedStringResourceConvertible {
    var localizedStringResource: LocalizedStringResource {
        "Siri is turned off in Reminderly, so I can't add a reminder right now."
    }
}

// An explicit time Reminderly can't use (Siri Stage 4, docs/plans/siri-stage4-datetime.md); no reminder was created
@available(iOS 16.0, *)
struct SiriUnsupportedTimeError: Error, CustomLocalizedStringResourceConvertible {
    let earlier: String
    let later: String
    var localizedStringResource: LocalizedStringResource {
        "Reminderly currently supports reminders in 15-minute increments. Try \(earlier) or \(later)."
    }
}

// A date with no time and no usable answer to "What time?" (docs/plans/no-auto-time.md, D7); no reminder was created
@available(iOS 16.0, *)
struct SiriNeedsTimeError: Error, CustomLocalizedStringResourceConvertible {
    var localizedStringResource: LocalizedStringResource {
        "Reminderly needs a time for that. Try again with a time, like today at 3pm."
    }
}

// The reminder was not saved, so Siri must not say "Okay, that's added"
@available(iOS 16.0, *)
struct SiriNotConfirmedError: Error, CustomLocalizedStringResourceConvertible {
    var localizedStringResource: LocalizedStringResource {
        "I couldn't confirm your reminder was added. Please check Reminderly."
    }
}
