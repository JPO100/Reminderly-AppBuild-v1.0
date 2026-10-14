import Capacitor

// Registers local plugins with the Capacitor bridge.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
