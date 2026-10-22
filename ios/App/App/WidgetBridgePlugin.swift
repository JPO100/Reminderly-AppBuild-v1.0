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
        CAPPluginMethod(name: "confirmSiriAdd", returnType: CAPPluginReturnPromise)
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

    // A Siri request's reminder is saved: AddReminderIntent waits for this code before saying "Done"
    @objc func confirmSiriAdd(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), !id.isEmpty,
              let defaults = UserDefaults(suiteName: "group.com.reminderly.app") else {
            call.reject("No request id or App Group unavailable")
            return
        }
        defaults.set(id, forKey: "siriAddedConfirmation")
        call.resolve()
    }
}
