import SwiftUI
import WebKit

struct NativeBridgeOutboundEvent: Equatable {
    let id = UUID()
    let payload: [String: String]
    let type: String
}

struct WebViewDiagnostics: Equatable {
    var latestProbe = "probe=pending"
}

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

private func bridgeLog(_ message: String) {
    print("[AIHybridBridge] \(message)")
}

private func makeDevURLRequest(url: URL) -> URLRequest {
    URLRequest(
        url: url,
        cachePolicy: .reloadIgnoringLocalAndRemoteCacheData,
        timeoutInterval: 20
    )
}

private let diagnosticBootstrapScript = """
window.__AI_H5_ERRORS__ = window.__AI_H5_ERRORS__ || [];
window.__AI_NATIVE_INJECTED_AT__ = new Date().toISOString();
window.addEventListener('error', function(event) {
  window.__AI_H5_ERRORS__.push({
    type: 'error',
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno
  });
});
window.addEventListener('unhandledrejection', function(event) {
  window.__AI_H5_ERRORS__.push({
    type: 'unhandledrejection',
    message: String(event.reason && event.reason.message ? event.reason.message : event.reason)
  });
});
"""

struct H5WebView: UIViewRepresentable {
    let url: URL
    @Binding var diagnostics: WebViewDiagnostics
    @Binding var loadState: WebViewLoadState
    let outboundEvent: NativeBridgeOutboundEvent?

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: NativeBridgeContract.handlerName)
        contentController.addUserScript(
            WKUserScript(
                source: diagnosticBootstrapScript,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController
        configuration.allowsInlineMediaPlayback = true
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        context.coordinator.webView = webView
        bridgeLog("create webview url=\(url.absoluteString)")
        webView.load(makeDevURLRequest(url: url))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if webView.url != url {
            loadState = .loading
            bridgeLog("reload webview from=\(webView.url?.absoluteString ?? "nil") to=\(url.absoluteString)")
            webView.load(makeDevURLRequest(url: url))
        }

        context.coordinator.dispatchNativeEvent(outboundEvent, to: webView)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private var parent: H5WebView
        private var lastDispatchedNativeEventID: UUID?
        weak var webView: WKWebView?

        init(_ parent: H5WebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            bridgeLog("navigation started url=\(webView.url?.absoluteString ?? parent.url.absoluteString)")
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            bridgeLog("navigation finished url=\(webView.url?.absoluteString ?? "nil")")
            parent.loadState = .ready
            sendHostContext(to: webView)
            probeWebView(webView, label: "didFinish")

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self, weak webView] in
                guard let self, let webView else {
                    return
                }

                self.probeWebView(webView, label: "after-1.2s")
            }
        }

        func webView(
            _ webView: WKWebView,
            didFail navigation: WKNavigation!,
            withError error: Error
        ) {
            bridgeLog("navigation failed error=\(error.localizedDescription)")
            parent.loadState = .failed(error.localizedDescription)
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            bridgeLog("provisional navigation failed error=\(error.localizedDescription)")
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

            bridgeLog("received from H5 type=\(type) id=\(id) payload=\(envelope["payload"] ?? [:])")

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
                    "ownsChrome": true,
                    "platform": "ios",
                ]
            )

            bridgeLog("send host context url=\(parent.url.absoluteString)")
            evaluateNativeMessage(envelope, in: webView)
        }

        func dispatchNativeEvent(_ event: NativeBridgeOutboundEvent?, to webView: WKWebView) {
            guard let event, lastDispatchedNativeEventID != event.id else {
                return
            }

            lastDispatchedNativeEventID = event.id

            let envelope = NativeBridgeContract.makeEnvelope(
                type: event.type,
                payload: event.payload
            )

            bridgeLog("send to H5 type=\(event.type) payload=\(event.payload)")
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
                bridgeLog("skip dispatch because webView/script is missing envelope=\(envelope)")
                return
            }

            webView.evaluateJavaScript(script) { _, error in
                if let error {
                    bridgeLog("dispatch failed type=\(envelope["type"] ?? "unknown") error=\(error.localizedDescription)")
                } else {
                    bridgeLog("dispatch succeeded type=\(envelope["type"] ?? "unknown")")
                }
            }
        }

        private func probeWebView(_ webView: WKWebView, label: String) {
            let probeScript = """
            JSON.stringify({
              label: '\(label)',
              href: window.location.href,
              readyState: document.readyState,
              scripts: document.scripts.length,
              debugBuild: window.__AI_H5_DEBUG_BUILD__ || null,
              injectedAt: window.__AI_NATIVE_INJECTED_AT__ || null,
              nativeBridge: !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.NativeBridge),
              nativeLastMessage: window.__AI_NATIVE_LAST_MESSAGE__ ? window.__AI_NATIVE_LAST_MESSAGE__.type : null,
              hasBridgeDebug: !!document.querySelector('.ai-agent-bridge-debug'),
              hasPreviewControls: !!document.querySelector('.ai-agent-preview-controls'),
              nativeEmbedded: document.querySelector('.ai-agent-page') ? document.querySelector('.ai-agent-page').dataset.nativeEmbedded : null,
              errorCount: window.__AI_H5_ERRORS__ ? window.__AI_H5_ERRORS__.length : 0,
              lastError: window.__AI_H5_ERRORS__ && window.__AI_H5_ERRORS__.length ? window.__AI_H5_ERRORS__[window.__AI_H5_ERRORS__.length - 1] : null
            })
            """

            webView.evaluateJavaScript(probeScript) { [weak self] result, error in
                guard let self else {
                    return
                }

                if let error {
                    let message = "probe=\(label) failed error=\(error.localizedDescription)"
                    bridgeLog(message)
                    self.parent.diagnostics.latestProbe = message
                    return
                }

                let snapshot = String(describing: result ?? "nil")
                bridgeLog("probe \(snapshot)")
                self.parent.diagnostics.latestProbe = snapshot
            }
        }
    }
}
