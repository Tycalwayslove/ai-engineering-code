import SwiftUI

struct HybridShellConfiguration {
    let title: String
    let h5URL: URL

    static let development = HybridShellConfiguration(
        title: "AI Native Shell",
        h5URL: URL(string: Bundle.main.h5DevServerURL)!
    )
}

private extension Bundle {
    var h5DevServerURL: String {
        let configuredURL = object(forInfoDictionaryKey: "H5DevServerURL") as? String
        let fallbackURL = "http://127.0.0.1:3000"

        guard let configuredURL, !configuredURL.isEmpty else {
            return fallbackURL
        }

        return configuredURL
    }
}

enum WebViewLoadState: Equatable {
    case loading
    case ready
    case failed(String)
}

struct HybridShellView: View {
    let configuration: HybridShellConfiguration

    @State private var loadState: WebViewLoadState = .loading

    var body: some View {
        ZStack {
            NativeShellStyle.background
                .ignoresSafeArea()

            H5WebView(url: configuration.h5URL, loadState: $loadState)
                .ignoresSafeArea()

            if loadState != .ready {
                NativeShellOverlay(
                    loadState: loadState,
                    title: configuration.title,
                    url: configuration.h5URL
                )
            }
        }
        .preferredColorScheme(.dark)
    }
}

private enum NativeShellStyle {
    static let background = Color(red: 0.03, green: 0.04, blue: 0.035)
    static let surface = Color(red: 0.09, green: 0.11, blue: 0.10).opacity(0.86)
    static let primary = Color(red: 0.03, green: 0.72, blue: 0.58)
    static let text = Color(red: 0.96, green: 0.98, blue: 0.96)
    static let muted = Color(red: 0.66, green: 0.70, blue: 0.68)
}

private struct NativeShellOverlay: View {
    let loadState: WebViewLoadState
    let title: String
    let url: URL

    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .tint(NativeShellStyle.primary)
                .opacity(loadState == .loading ? 1 : 0)

            VStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                    .foregroundStyle(NativeShellStyle.text)

                Text(message)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(NativeShellStyle.muted)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 22)
        .background(.ultraThinMaterial)
        .background(NativeShellStyle.surface)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .black.opacity(0.28), radius: 24, x: 0, y: 18)
        .padding(24)
    }

    private var message: String {
        switch loadState {
        case .loading:
            return "正在加载 H5 产品层：\(url.absoluteString)"
        case .ready:
            return "H5 已就绪"
        case .failed(let reason):
            return "H5 加载失败：\(reason)"
        }
    }
}
