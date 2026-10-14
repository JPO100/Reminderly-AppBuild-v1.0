import Capacitor
import WidgetKit

// Lock screen widget bridge: stores today's progress in the shared App Group and reloads the widget.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearSnapshot", returnType: CAPPluginReturnPromise)
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
}
