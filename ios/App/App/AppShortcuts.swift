import AppIntents

@available(iOS 16.0, *)
struct AppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddReminderIntent(),
            // Listed in Reminders settings > Siri shortcuts (SIRI_PHRASES in SettingsPanelContent.tsx); keep both in step
            // Only this phrase: ones with "remind" or "reminder" made Siri ask "Reminderly or Notes?" every time
            phrases: [
                "Add to \(.applicationName) app",
            ],
            shortTitle: "Add Reminder",
            systemImageName: "bell.badge"
        )
    }
}
