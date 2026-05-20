import SwiftUI
import WebKit

private enum NativeBridgeContract {
    static let bridgeVersion = "0.1.0"
    static let handlerName = "NativeBridge"
    static let nativeMessageEventName = "ai-native-message"

    static func makeEnvelope(
        type: String,
        payload: [String: Any],
        replyTo: String? = nil
    ) -> [String: Any] {
        var envelope: [String: Any] = [
            "id": "native_\(UUID().uuidString)",
            "payload": payload,
            "sentAt": ISO8601DateFormatter().string(from: Date()),
            "type": type,
        ]

        if let replyTo {
            envelope["replyTo"] = replyTo
        }

        return envelope
    }

    static func makeDispatchScript(envelope: [String: Any]) -> String? {
        guard
            let data = try? JSONSerialization.data(withJSONObject: envelope),
            let json = String(data: data, encoding: .utf8)
        else {
            return nil
        }

        return """
        window.__AI_NATIVE_LAST_MESSAGE__ = \(json);
        window.dispatchEvent(new CustomEvent('\(nativeMessageEventName)', { detail: \(json) }));
        """
    }
}

struct H5WebView: UIViewRepresentable {
    let url: URL
    @Binding var loadState: WebViewLoadState

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: NativeBridgeContract.handlerName)

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController
        configuration.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        context.coordinator.webView = webView
        webView.load(URLRequest(url: url))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard webView.url != url else {
            return
        }

        loadState = .loading
        webView.load(URLRequest(url: url))
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private var parent: H5WebView
        weak var webView: WKWebView?

        init(_ parent: H5WebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.loadState = .ready
            sendHostContext(to: webView)
        }

        func webView(
            _ webView: WKWebView,
            didFail navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.loadState = .failed(error.localizedDescription)
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.loadState = .failed(error.localizedDescription)
        }

        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == NativeBridgeContract.handlerName else {
                return
            }

            handleBridgeMessage(message.body)
        }

        private func handleBridgeMessage(_ body: Any) {
            guard
                let envelope = body as? [String: Any],
                let id = envelope["id"] as? String,
                let type = envelope["type"] as? String
            else {
                sendNativeError(
                    payload: [
                        "reason": "Invalid NativeBridge envelope",
                    ],
                    replyTo: nil
                )
                return
            }

            print("NativeBridge message:", envelope)

            switch type {
            case "h5.ready":
                if let webView {
                    sendHostContext(to: webView)
                }
                sendNativeAck(type: type, replyTo: id)
            case "ui.openTimeline", "ui.openCalendar", "ui.openExecutionLedger":
                sendNativeAck(type: type, replyTo: id)
            case "input.voice.start":
                sendNativeAck(
                    type: type,
                    payload: [
                        "status": "notImplemented",
                        "reason": "iOS voice input will be connected after the Bridge contract is stabilized.",
                    ],
                    replyTo: id
                )
            case "input.keyboard.open":
                sendNativeAck(type: type, replyTo: id)
            default:
                sendNativeError(
                    payload: [
                        "reason": "Unsupported message type: \(type)",
                    ],
                    replyTo: id
                )
            }
        }

        private func sendHostContext(to webView: WKWebView) {
            let envelope = NativeBridgeContract.makeEnvelope(
                type: "native.hostContext",
                payload: [
                    "bridgeVersion": NativeBridgeContract.bridgeVersion,
                    "h5URL": parent.url.absoluteString,
                    "platform": "ios",
                ]
            )

            evaluateNativeMessage(envelope, in: webView)
        }

        private func sendNativeAck(
            type: String,
            payload: [String: Any] = [:],
            replyTo: String
        ) {
            var ackPayload = payload
            ackPayload["receivedType"] = type

            let envelope = NativeBridgeContract.makeEnvelope(
                type: "native.ack",
                payload: ackPayload,
                replyTo: replyTo
            )

            evaluateNativeMessage(envelope, in: webView)
        }

        private func sendNativeError(payload: [String: Any], replyTo: String?) {
            let envelope = NativeBridgeContract.makeEnvelope(
                type: "native.error",
                payload: payload,
                replyTo: replyTo
            )

            evaluateNativeMessage(envelope, in: webView)
        }

        private func evaluateNativeMessage(_ envelope: [String: Any], in webView: WKWebView?) {
            guard
                let webView,
                let script = NativeBridgeContract.makeDispatchScript(envelope: envelope)
            else {
                return
            }

            webView.evaluateJavaScript(script) { _, error in
                if let error {
                    print("NativeBridge dispatch failed:", error.localizedDescription)
                }
            }
        }
    }
}
