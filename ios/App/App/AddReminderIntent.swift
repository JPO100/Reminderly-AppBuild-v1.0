import AppIntents
import UIKit

// Runs without opening Reminderly, then brings it to the foreground to add the reminder
// (docs/plans/siri-off-refusal.md). ForegroundContinuableIntent needs iOS 16.4.
@available(iOS 16.4, *)
struct AddReminderIntent: AppIntent, ForegroundContinuableIntent {
    static var title: LocalizedStringResource = "Add to Reminderly"
    static var description = IntentDescription("Create a reminder in Reminderly using natural language")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Reminder text", requestValueDialog: "What would you like to be reminded about?")
    var text: String?

    func perform() async throws -> some IntentResult {
        var reminderText = text ?? ""
        if reminderText.isEmpty {
            reminderText = try await $text.requestValue() ?? ""
        }
        guard !reminderText.isEmpty else { return .result() }

        // Query separators must be encoded too, or "&" cuts the text short
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&+=?#")
        let encoded = reminderText.addingPercentEncoding(withAllowedCharacters: allowed) ?? reminderText
        guard let url = URL(string: "reminderly://add?text=\(encoded)") else { return .result() }

        try await requestToContinueInForeground {
            await UIApplication.shared.open(url)
        }
        return .result()
    }
}
