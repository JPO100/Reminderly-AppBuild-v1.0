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

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // A link that launches the app cold arrives here, not in openURLContexts; Capacitor keeps it for getLaunchUrl.
        if let url = connectionOptions.urlContexts.first?.url, url.scheme == "reminderly", url.host != "add" {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // With scenes, application(_:open:) is not called, so other links (reminderly://list/<id>) go to Capacitor here.
        if let url = URLContexts.first?.url, url.scheme == "reminderly", url.host != "add" {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
            return
        }
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

        let js = "localStorage.setItem('reminderly.pendingSiriText','\(escaped)');window.dispatchEvent(new CustomEvent('reminderly:siri-add'));"

        if let windowScene = scene as? UIWindowScene,
           let vc = windowScene.windows.first?.rootViewController as? CAPBridgeViewController {
            vc.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

}
