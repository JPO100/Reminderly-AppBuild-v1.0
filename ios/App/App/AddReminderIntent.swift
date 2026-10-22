import AppIntents
import UIKit

// Siri off: spoken refusal (docs/plans/siri-off-refusal.md).
// iOS 26+: the intent starts in the background, refuses when Siri is off in Reminderly,
// otherwise asks for the text and continues in the foreground without a confirmation.
// iOS 16.0 to 25: unchanged behaviour. The app opens first and ignores the request when Siri is off.
// Spoken "Done" (docs/plans/siri-done-confirmation.md): only once the app confirms the reminder is saved.
@available(iOS 16.0, *)
struct AddReminderIntent: AppIntent {
    static var title: LocalizedStringResource = "Add to Reminderly"
    static var description = IntentDescription("Create a reminder in Reminderly using natural language")
    static var openAppWhenRun: Bool = true

    @available(iOS 26.0, *)
    static var supportedModes: IntentModes { [.background, .foreground(.dynamic)] }

    @Parameter(title: "Reminder text")
    var text: String?

    private static let appGroup = "group.com.reminderly.app"
    // Written by the app (WidgetBridge.confirmSiriAdd) once the reminder is saved
    private static let confirmationKey = "siriAddedConfirmation"
    private static let confirmationTimeout: Duration = .seconds(5)

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
        // Query separators must be encoded too, or "&" cuts the text short
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&+=?#")
        let encoded = reminderText.addingPercentEncoding(withAllowedCharacters: allowed) ?? reminderText
        guard let url = URL(string: "reminderly://add?text=\(encoded)&id=\(requestId)") else { throw SiriNotConfirmedError() }

        if #available(iOS 26.0, *) {
            try await continueInForeground(alwaysConfirm: false)
        }
        await UIApplication.shared.open(url)

        guard await Self.waitForConfirmation(of: requestId) else { throw SiriNotConfirmedError() }
        return .result(dialog: "Done")
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
