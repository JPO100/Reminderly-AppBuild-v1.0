import WidgetKit
import SwiftUI

// Lock screen widget: outstanding reminders in the centre, arc shows today's completed share.
// The app writes the snapshot (WidgetBridgePlugin) whenever reminders change.

struct ProgressEntry: TimelineEntry {
    let date: Date
    let outstanding: Int? // nil: no shared data (flag off or app not opened yet), neutral empty state
    let done: Int
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> ProgressEntry {
        ProgressEntry(date: Date(), outstanding: 1, done: 2)
    }

    func getSnapshot(in context: Context, completion: @escaping (ProgressEntry) -> Void) {
        completion(entry(for: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressEntry>) -> Void) {
        let now = Date()
        let midnight = Calendar.current.date(byAdding: .day, value: 1, to: Calendar.current.startOfDay(for: now))!
        completion(Timeline(entries: [entry(for: now), entry(for: midnight)], policy: .after(midnight)))
    }

    private func entry(for date: Date) -> ProgressEntry {
        guard let snapshot = UserDefaults(suiteName: "group.com.reminderly.app")?.dictionary(forKey: "todayProgress") else {
            return ProgressEntry(date: date, outstanding: nil, done: 0)
        }
        let outstanding = snapshot["outstanding"] as? Int ?? 0
        let done = snapshot["done"] as? Int ?? 0
        let dueTomorrow = snapshot["dueTomorrow"] as? Int ?? 0
        if snapshot["date"] as? String == dateKey(date) {
            return ProgressEntry(date: date, outstanding: outstanding, done: done)
        }
        // Snapshot from an earlier day: outstanding becomes overdue, tomorrow's become due, done resets
        return ProgressEntry(date: date, outstanding: outstanding + dueTomorrow, done: 0)
    }

    private func dateKey(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

struct ReminderlyWidgetView: View {
    let entry: ProgressEntry

    private var progress: Double {
        guard let outstanding = entry.outstanding else { return 0 }
        let total = outstanding + entry.done
        return total == 0 ? 1 : Double(entry.done) / Double(total)
    }

    // Fills the system accessoryCircular container, matching native circular widgets
    var body: some View {
        ZStack {
            arc(to: 1).opacity(0.3)
            if progress > 0 { arc(to: progress) }
            if let outstanding = entry.outstanding {
                Text("\(outstanding)")
                    .font(.system(size: 26, weight: .medium, design: .rounded))
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                    .padding(.horizontal, 12)
            }
            VStack {
                Spacer()
                Image("Tick")
                    .resizable()
                    .renderingMode(.template)
                    .scaledToFit()
                    .frame(width: 14)
            }
            .padding(.bottom, 2)
        }
        .widgetBackground()
    }

    // Open arc with the gap at the bottom (270 degrees), stroke inset so it sits on the container edge
    private func arc(to fraction: Double) -> some View {
        Circle()
            .inset(by: 3)
            .trim(from: 0, to: 0.75 * fraction)
            .stroke(style: StrokeStyle(lineWidth: 6, lineCap: .round))
            .rotationEffect(.degrees(135))
    }
}

private extension View {
    @ViewBuilder
    func widgetBackground() -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(for: .widget) { AccessoryWidgetBackground() }
        } else {
            background(AccessoryWidgetBackground())
        }
    }
}

@main
struct ReminderlyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ReminderlyTodayProgress", provider: Provider()) { entry in
            ReminderlyWidgetView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Reminders left today and your progress.")
        .supportedFamilies([.accessoryCircular])
    }
}
