import AppIntents
import UIKit

@available(iOS 16.0, *)
struct AddReminderIntent: AppIntent {
    static var title: LocalizedStringResource = "Add to Reminderly"
    static var description = IntentDescription("Create a reminder in Reminderly using natural language")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Reminder text", requestValueDialog: "What would you like to be reminded about?")
    var text: String

    func perform() async throws -> some IntentResult {
        // Query separators must be encoded too, or "&" cuts the text short
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&+=?#")
        let encoded = text.addingPercentEncoding(withAllowedCharacters: allowed) ?? text
        if let url = URL(string: "reminderly://add?text=\(encoded)") {
            await UIApplication.shared.open(url)
        }
        return .result()
    }
}
