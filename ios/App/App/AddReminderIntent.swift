import AppIntents
import Capacitor
import UIKit
import UserNotifications

// Siri off: spoken refusal (docs/plans/siri-off-refusal.md).
// iOS 26+: the intent starts in the background, refuses when Siri is off in Reminderly.
// iOS 16.0 to 25: unchanged behaviour. The app opens first and ignores the request when Siri is off.
// Spoken "That's done" (docs/plans/siri-done-confirmation.md): only once the app confirms the reminder is saved.
//
// SPIKE (docs/plans/siri-background-spike.md): on iOS 26+ the intent never brings Reminderly to the foreground. It hands
// the request to the existing web view wherever it is running, then waits for the saved-reminder confirmation. Each run
// records diagnostics in the App Group (siriSpikeLog) and Siri names the reason when it cannot confirm.
@available(iOS 16.0, *)
struct AddReminderIntent: AppIntent {
    static var title: LocalizedStringResource = "Add to Reminderly"
    static var description = IntentDescription("Create a reminder in Reminderly using natural language")
    static var openAppWhenRun: Bool = true
    static var authenticationPolicy: IntentAuthenticationPolicy = .alwaysAllowed

    @available(iOS 26.0, *)
    static var supportedModes: IntentModes { [.background] }

    @Parameter(title: "Reminder text")
    var text: String?

    private static let appGroup = "group.com.reminderly.app"
    // Written by the app (WidgetBridge.confirmSiriAdd) once the reminder is saved
    private static let confirmationKey = "siriAddedConfirmation"
    private static let confirmationTimeout: Duration = .seconds(8)

    func perform() async throws -> some IntentResult & ProvidesDialog {
        if #available(iOS 26.0, *) {
            // Fails closed: only a stored true, written by the app, accepts the request
            let active = UserDefaults(suiteName: Self.appGroup)?.object(forKey: "siriRemindersActive") as? Bool
            guard active == true else { throw SiriOffError() }
        }

        var reminderText = text ?? ""
        if reminderText.isEmpty {
            reminderText = try await $text.requestValue("What would you like to be reminded about?") ?? ""
        }
        guard !reminderText.isEmpty else { throw SiriNotConfirmedError() }

        // A one-off code for this request; the app writes it back once the reminder is saved
        let requestId = UUID().uuidString

        if #available(iOS 26.0, *) {
            var log = SpikeLog(requestId: requestId)
            await log.recordAppState(stage: "start")
            log.pendingBefore = await Self.pendingNotificationCount()

            let delivery = await Self.deliverToWebView(text: reminderText, requestId: requestId)
            log.delivery = delivery
            await log.recordAppState(stage: "delivered")

            let confirmed = await Self.waitForConfirmation(of: requestId)
            log.confirmed = confirmed
            if confirmed {
                // Give the app's notification sync a moment, then count again
                try? await Task.sleep(for: .milliseconds(1500))
            }
            log.pendingAfter = await Self.pendingNotificationCount()
            await log.recordAppState(stage: "end")
            log.save()

            guard confirmed else { throw SpikeNotConfirmedError(reason: delivery) }
            return .result(dialog: "That's done")
        }

        // iOS 16.0 to 25: the app is already open (openAppWhenRun); hand over by URL as before
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&+=?#")
        let encoded = reminderText.addingPercentEncoding(withAllowedCharacters: allowed) ?? reminderText
        guard let url = URL(string: "reminderly://add?text=\(encoded)&id=\(requestId)") else { throw SiriNotConfirmedError() }
        await UIApplication.shared.open(url)
        guard await Self.waitForConfirmation(of: requestId) else { throw SiriNotConfirmedError() }
        return .result(dialog: "That's done")
    }

    // Hands the request to the running web view, the same JavaScript the URL handler runs. Returns what happened.
    @MainActor
    private static func deliverToWebView(text: String, requestId: String) async -> String {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let bridge = scenes.flatMap(\.windows).compactMap { $0.rootViewController as? CAPBridgeViewController }.first
        guard let webView = bridge?.bridge?.webView else { return scenes.isEmpty ? "no-scene" : "no-webview" }

        // A web view launched for this request may still be loading the app
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: .seconds(5))
        while webView.isLoading || webView.url == nil {
            if clock.now >= deadline { return "webview-not-loaded" }
            try? await Task.sleep(for: .milliseconds(100))
        }

        let escaped = text
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
        let js = "localStorage.setItem('reminderly.pendingSiriId','\(requestId)');localStorage.setItem('reminderly.pendingSiriText','\(escaped)');window.dispatchEvent(new CustomEvent('reminderly:siri-add'));"
        do {
            _ = try await webView.evaluateJavaScript(js)
            return "delivered"
        } catch {
            return "js-error"
        }
    }

    // Polls the App Group until the app confirms this request, or the timeout passes
    private static func waitForConfirmation(of requestId: String) async -> Bool {
        let clock = ContinuousClock()
        let deadline = clock.now.advanced(by: confirmationTimeout)
        while clock.now < deadline {
            if UserDefaults(suiteName: appGroup)?.string(forKey: confirmationKey) == requestId { return true }
            try? await Task.sleep(for: .milliseconds(200))
        }
        return false
    }

    private static func pendingNotificationCount() async -> Int {
        await UNUserNotificationCenter.current().pendingNotificationRequests().count
    }
}

// SPIKE diagnostics: one line per Siri run in the App Group key siriSpikeLog (last 30 kept)
@available(iOS 16.0, *)
private struct SpikeLog {
    let requestId: String
    var stages: [String] = []
    var delivery = "not-run"
    var confirmed = false
    var pendingBefore = -1
    var pendingAfter = -1

    init(requestId: String) { self.requestId = requestId }

    @MainActor
    mutating func recordAppState(stage: String) {
        let app = UIApplication.shared
        let state: String
        switch app.applicationState {
        case .active: state = "active"
        case .inactive: state = "inactive"
        case .background: state = "background"
        @unknown default: state = "unknown"
        }
        stages.append("\(stage):\(state),protected=\(app.isProtectedDataAvailable),scenes=\(app.connectedScenes.count)")
    }

    func save() {
        guard let defaults = UserDefaults(suiteName: "group.com.reminderly.app") else { return }
        let line = "\(ISO8601DateFormatter().string(from: Date())) id=\(requestId.prefix(8)) \(stages.joined(separator: " | ")) delivery=\(delivery) confirmed=\(confirmed) pending=\(pendingBefore)->\(pendingAfter)"
        var lines = defaults.stringArray(forKey: "siriSpikeLog") ?? []
        lines.append(line)
        defaults.set(Array(lines.suffix(30)), forKey: "siriSpikeLog")
    }
}

// Siri speaks the error's text and ends
@available(iOS 16.0, *)
struct SiriOffError: Error, CustomLocalizedStringResourceConvertible {
    var localizedStringResource: LocalizedStringResource {
        "Siri is turned off in Reminderly, so I can't add a reminder right now."
    }
}

// The app did not confirm the reminder was saved, so Siri must not say "Done"
@available(iOS 16.0, *)
struct SiriNotConfirmedError: Error, CustomLocalizedStringResourceConvertible {
    var localizedStringResource: LocalizedStringResource {
        "I couldn't confirm your reminder was added. Please check Reminderly."
    }
}

// SPIKE: names the reason, so John can tell the outcomes apart in CarPlay
@available(iOS 16.0, *)
struct SpikeNotConfirmedError: Error, CustomLocalizedStringResourceConvertible {
    let reason: String
    var localizedStringResource: LocalizedStringResource {
        "Spike result: not confirmed, \(reason.replacingOccurrences(of: "-", with: " "))."
    }
}
