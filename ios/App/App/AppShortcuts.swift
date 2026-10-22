import AppIntents

@available(iOS 16.4, *)
struct AppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddReminderIntent(),
            // Listed in Reminders settings > Siri shortcuts (SIRI_PHRASES in SettingsPanelContent.tsx); keep both in step
            phrases: [
                "Add to \(.applicationName) app",
                "Remind me in \(.applicationName) app",
                "New reminder in \(.applicationName) app",
                "Add a reminder in \(.applicationName) app",
            ],
            shortTitle: "Add Reminder",
            systemImageName: "bell.badge"
        )
    }
}
