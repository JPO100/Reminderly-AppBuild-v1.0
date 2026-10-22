import Capacitor
import WidgetKit

// Lock screen widget bridge: stores today's progress in the shared App Group and reloads the widget.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSiriActive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSiriContext", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSiriPending", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeSiriPending", returnType: CAPPluginReturnPromise)
    ]

    @objc func setSnapshot(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: "group.com.reminderly.app") else {
            call.reject("App Group unavailable")
            return
        }
        defaults.set([
            "date": call.getString("date") ?? "",
            "outstanding": call.getInt("outstanding") ?? 0,
            "done": call.getInt("done") ?? 0,
            "dueTomorrow": call.getInt("dueTomorrow") ?? 0
        ], forKey: "todayProgress")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }

    // Lock screen widget flag off: remove shared reminder data so the widget shows its empty state.
    @objc func clearSnapshot(_ call: CAPPluginCall) {
        UserDefaults(suiteName: "group.com.reminderly.app")?.removeObject(forKey: "todayProgress")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }

    // Siri for reminders on or off, read by AddReminderIntent (docs/plans/siri-off-refusal.md)
    @objc func setSiriActive(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: "group.com.reminderly.app") else {
            call.reject("App Group unavailable")
            return
        }
        defaults.set(call.getBool("active") ?? false, forKey: "siriRemindersActive")
        call.resolve()
    }

    // Siri locked-device creation (docs/plans/siri-locked-device.md). The Siri context (JSON): notification settings,
    // repeat setting and badge timeline, read by AddReminderIntent.
    @objc func setSiriContext(_ call: CAPPluginCall) {
        guard let json = call.getString("json"),
              let defaults = UserDefaults(suiteName: "group.com.reminderly.app") else {
            call.reject("No context or App Group unavailable")
            return
        }
        defaults.set(json, forKey: "siriContext")
        call.resolve()
    }

    // Reminders the Siri intent saved while Reminderly was not running, one JSON string each. Read and changed on the
    // main thread only, as the intent does, so the two never interleave.
    @objc func getSiriPending(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let items = UserDefaults(suiteName: "group.com.reminderly.app")?.stringArray(forKey: "siriPendingReminders") ?? []
            call.resolve(["items": items])
        }
    }

    // Removes the entries whose reminder id is listed (imported and saved, or malformed)
    @objc func removeSiriPending(_ call: CAPPluginCall) {
        let ids = Set(call.getArray("ids", String.self) ?? [])
        DispatchQueue.main.async {
            guard let defaults = UserDefaults(suiteName: "group.com.reminderly.app") else {
                call.reject("App Group unavailable")
                return
            }
            let items = defaults.stringArray(forKey: "siriPendingReminders") ?? []
            let kept = items.filter { item in
                guard let data = item.data(using: .utf8),
                      let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let id = object["id"] as? String else { return true }
                return !ids.contains(id)
            }
            defaults.set(kept, forKey: "siriPendingReminders")
            call.resolve()
        }
    }
}
