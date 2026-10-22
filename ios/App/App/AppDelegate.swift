import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UIWindowSceneDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url,
              url.scheme == "reminderly",
              url.host == "add",
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let text = components.queryItems?.first(where: { $0.name == "text" })?.value
        else { return }

        let escaped = text
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")

        // The Siri request's one-off code (letters, digits and hyphens only), confirmed back once the reminder is saved
        let requestId = (components.queryItems?.first(where: { $0.name == "id" })?.value ?? "")
            .filter { $0.isLetter || $0.isNumber || $0 == "-" }

        let js = "localStorage.setItem('reminderly.pendingSiriId','\(requestId)');localStorage.setItem('reminderly.pendingSiriText','\(escaped)');window.dispatchEvent(new CustomEvent('reminderly:siri-add'));"

        if let windowScene = scene as? UIWindowScene,
           let vc = windowScene.windows.first?.rootViewController as? CAPBridgeViewController {
            vc.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

}
