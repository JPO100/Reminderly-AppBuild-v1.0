import AppIntents
import UIKit

// Siri off: spoken refusal (docs/plans/siri-off-refusal.md). Spike 2.
// iOS 26+: the intent starts in the background, refuses when Siri is off in Reminderly,
// otherwise asks for the text and continues in the foreground without a confirmation.
// iOS 16.0 to 25: unchanged behaviour. The app opens first and ignores the request when Siri is off.
@available(iOS 16.0, *)
struct AddReminderIntent: AppIntent {
    static var title: LocalizedStringResource = "Add to Reminderly"
    static var description = IntentDescription("Create a reminder in Reminderly using natural language")
    static var openAppWhenRun: Bool = true

    @available(iOS 26.0, *)
    static var supportedModes: IntentModes { [.background, .foreground(.dynamic)] }

    @Parameter(title: "Reminder text")
    var text: String?

    func perform() async throws -> some IntentResult {
        if #available(iOS 26.0, *) {
            // Fails closed: only a stored true, written by the app, accepts the request
            let active = UserDefaults(suiteName: "group.com.reminderly.app")?.object(forKey: "siriRemindersActive") as? Bool
            guard active == true else { throw SiriOffError() }
        }

        var reminderText = text ?? ""
        if reminderText.isEmpty {
            reminderText = try await $text.requestValue("What would you like to be reminded about?") ?? ""
        }
        guard !reminderText.isEmpty else { return .result() }

        // Query separators must be encoded too, or "&" cuts the text short
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&+=?#")
        let encoded = reminderText.addingPercentEncoding(withAllowedCharacters: allowed) ?? reminderText
        guard let url = URL(string: "reminderly://add?text=\(encoded)") else { return .result() }

        if #available(iOS 26.0, *) {
            try await continueInForeground(alwaysConfirm: false)
        }
        await UIApplication.shared.open(url)
        return .result()
    }
}

// Siri speaks the error's text and ends
@available(iOS 16.0, *)
struct SiriOffError: Error, CustomLocalizedStringResourceConvertible {
    var localizedStringResource: LocalizedStringResource {
        "Siri is turned off in Reminderly, so I can't add a reminder right now."
    }
}
