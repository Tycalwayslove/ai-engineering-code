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
        let fallbackURL = "http://127.0.0.1:3000/?native=ios"

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

private enum NativeSurface: String {
    case calendar
    case conversation
    case ledger
    case timeline
}

private enum NativeDrawerPanel: String, Identifiable {
    case calendar
    case ledger
    case timeline

    var id: String {
        rawValue
    }

    var surface: NativeSurface {
        switch self {
        case .calendar:
            return .calendar
        case .ledger:
            return .ledger
        case .timeline:
            return .timeline
        }
    }

    var title: String {
        switch self {
        case .calendar:
            return "完整日历"
        case .ledger:
            return "执行记录"
        case .timeline:
            return "Timepage"
        }
    }
}

struct HybridShellView: View {
    let configuration: HybridShellConfiguration

    @State private var activePanel: NativeDrawerPanel?
    @State private var bridgeEvent: NativeBridgeOutboundEvent?
    @State private var loadState: WebViewLoadState = .loading

    var body: some View {
        ZStack {
            NativeShellStyle.background
                .ignoresSafeArea()

            VStack(spacing: 0) {
                NativeShellHeader(
                    onCalendar: {
                        openPanel(.calendar, source: "native.header.calendar")
                    },
                    onLedger: {
                        openPanel(.ledger, source: "native.header.ledger")
                    },
                    onMenu: {
                        openPanel(.timeline, source: "native.header.menu")
                    }
                )

                H5WebView(
                    url: configuration.h5URL,
                    loadState: $loadState,
                    outboundEvent: bridgeEvent
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                VStack(spacing: 10) {
                    NativeExecutionStatusBar()
                    NativeComposerBar(
                        onKeyboard: {
                            sendInputRequest("keyboard", source: "native.composer.keyboard")
                        },
                        onVoice: {
                            sendInputRequest("voice", source: "native.composer.voice")
                        }
                    )
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 12)
            }

            if loadState != .ready {
                NativeShellOverlay(
                    loadState: loadState,
                    title: configuration.title,
                    url: configuration.h5URL
                )
            }

            if let activePanel {
                NativeDrawerOverlay(
                    panel: activePanel,
                    onClose: {
                        closePanel()
                    }
                )
                .transition(.move(edge: .leading).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.34, dampingFraction: 0.88), value: activePanel)
        .preferredColorScheme(.dark)
    }

    private func closePanel() {
        activePanel = nil
        sendViewChanged(.conversation, source: "native.drawer.close")
    }

    private func openPanel(_ panel: NativeDrawerPanel, source: String) {
        activePanel = panel
        sendViewChanged(panel.surface, source: source)
    }

    private func sendInputRequest(_ mode: String, source: String) {
        bridgeEvent = NativeBridgeOutboundEvent(
            payload: [
                "inputMode": mode,
                "source": source,
            ],
            type: "native.inputRequested"
        )
    }

    private func sendViewChanged(_ surface: NativeSurface, source: String) {
        bridgeEvent = NativeBridgeOutboundEvent(
            payload: [
                "source": source,
                "view": surface.rawValue,
            ],
            type: "native.viewChanged"
        )
    }
}

private enum NativeShellStyle {
    static let background = Color(red: 0.03, green: 0.04, blue: 0.035)
    static let surface = Color(red: 0.09, green: 0.11, blue: 0.10).opacity(0.86)
    static let primary = Color(red: 0.03, green: 0.72, blue: 0.58)
    static let text = Color(red: 0.96, green: 0.98, blue: 0.96)
    static let muted = Color(red: 0.66, green: 0.70, blue: 0.68)
}

private struct NativeShellHeader: View {
    let onCalendar: () -> Void
    let onLedger: () -> Void
    let onMenu: () -> Void

    var body: some View {
        HStack(spacing: 14) {
            NativeIconButton(systemName: "line.3.horizontal", action: onMenu)

            VStack(spacing: 2) {
                Text("AI 日程执行")
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundStyle(NativeShellStyle.text)

                Text("Native 壳层 · H5 元素区")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(NativeShellStyle.muted)
            }
            .frame(maxWidth: .infinity)

            HStack(spacing: 10) {
                NativeIconButton(systemName: "clock", action: onLedger)
                NativeIconButton(systemName: "calendar", action: onCalendar)
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(
            LinearGradient(
                colors: [
                    NativeShellStyle.background.opacity(0.98),
                    NativeShellStyle.background.opacity(0.72),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
}

private struct NativeIconButton: View {
    let systemName: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(NativeShellStyle.text)
                .frame(width: 42, height: 42)
                .background(.ultraThinMaterial)
                .background(Color.white.opacity(0.05))
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.24), radius: 12, x: 0, y: 8)
        }
        .buttonStyle(.plain)
    }
}

private struct NativeExecutionStatusBar: View {
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(NativeShellStyle.primary)

            VStack(alignment: .leading, spacing: 2) {
                Text("已解析 1 项创建操作")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(NativeShellStyle.text)

                Text("等待你确认后再写入后端日程域")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(NativeShellStyle.muted)
            }

            Spacer(minLength: 8)

            Text("confirming")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(NativeShellStyle.primary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .background(NativeShellStyle.surface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct NativeComposerBar: View {
    let onKeyboard: () -> Void
    let onVoice: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            NativeIconButton(systemName: "camera.fill") {}

            Button(action: onVoice) {
                Text("按住说话")
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundStyle(NativeShellStyle.text)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Color.black.opacity(0.38))
                    .clipShape(Capsule())
                    .overlay(
                        Capsule()
                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)

            NativeIconButton(systemName: "keyboard", action: onKeyboard)
        }
    }
}

private struct NativeDrawerOverlay: View {
    let panel: NativeDrawerPanel
    let onClose: () -> Void

    var body: some View {
        ZStack(alignment: .leading) {
            Color.black.opacity(0.34)
                .ignoresSafeArea()
                .onTapGesture(perform: onClose)

            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(panel.title)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundStyle(NativeShellStyle.text)

                        Text("由 iOS 原生壳控制，H5 只同步内容元素")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(NativeShellStyle.muted)
                    }

                    Spacer()

                    NativeIconButton(systemName: "xmark", action: onClose)
                }

                switch panel {
                case .calendar:
                    NativeCalendarSummary()
                case .ledger:
                    NativeLedgerSummary()
                case .timeline:
                    NativeTimepageTimeline()
                }
            }
            .padding(18)
            .frame(width: 326)
            .frame(maxHeight: .infinity, alignment: .top)
            .background(.ultraThinMaterial)
            .background(Color(red: 0.08, green: 0.09, blue: 0.085).opacity(0.96))
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 0,
                    bottomLeadingRadius: 0,
                    bottomTrailingRadius: 28,
                    topTrailingRadius: 28,
                    style: .continuous
                )
            )
            .shadow(color: .black.opacity(0.34), radius: 30, x: 16, y: 0)
            .ignoresSafeArea(edges: .vertical)
        }
    }
}

private struct NativeTimepageTimeline: View {
    private let days: [(weekday: String, date: String, events: [(String, String, Color)])] = [
        ("周三", "20", [("团队站会", "09:30 -> 10:00", .blue), ("设计 Review", "16:00 -> 17:00", NativeShellStyle.primary)]),
        ("周四", "21", [("新年业务规划会", "15:00 -> 16:30", .orange), ("复盘整理", "19:30 -> 20:30", .green)]),
        ("周五", "22", [("1:1 沟通", "14:00 -> 14:30", .blue)]),
        ("周六", "23", [("自由安排", "全天", .green)]),
    ]

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 8) {
                Text("2026 五月")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(NativeShellStyle.primary)
                    .rotationEffect(.degrees(-90))
                    .frame(width: 28, height: 94)

                Rectangle()
                    .fill(NativeShellStyle.primary.opacity(0.45))
                    .frame(width: 2)
            }

            VStack(spacing: 10) {
                ForEach(days, id: \.date) { day in
                    HStack(alignment: .top, spacing: 12) {
                        VStack(spacing: 2) {
                            Text(day.weekday)
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                                .foregroundStyle(NativeShellStyle.muted)
                            Text(day.date)
                                .font(.system(size: 26, weight: .bold, design: .rounded))
                                .foregroundStyle(NativeShellStyle.text)
                        }
                        .frame(width: 48)

                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(day.events, id: \.0) { event in
                                HStack(alignment: .top, spacing: 8) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(event.2)
                                        .frame(width: 4, height: 34)

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(event.0)
                                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                                            .foregroundStyle(NativeShellStyle.text)
                                        Text(event.1)
                                            .font(.system(size: 12, weight: .medium, design: .rounded))
                                            .foregroundStyle(NativeShellStyle.muted)
                                    }
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(12)
                    .background(Color.white.opacity(day.date == "20" ? 0.08 : 0.04))
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
            }
        }
    }
}

private struct NativeCalendarSummary: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(["今天 4 项安排", "明天 1 项待确认", "本周仍有 3.5h 可用时间"], id: \.self) { item in
                HStack {
                    Image(systemName: "calendar")
                        .foregroundStyle(NativeShellStyle.primary)
                    Text(item)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(NativeShellStyle.text)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
        }
    }
}

private struct NativeLedgerSummary: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(["解析时间表达", "等待创建日程"], id: \.self) { item in
                HStack {
                    Image(systemName: item == "解析时间表达" ? "checkmark.circle.fill" : "clock.fill")
                        .foregroundStyle(item == "解析时间表达" ? NativeShellStyle.primary : .orange)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(NativeShellStyle.text)
                        Text(item == "解析时间表达" ? "已完成" : "确认后写入内部日历")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(NativeShellStyle.muted)
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
        }
    }
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
