import SwiftUI

private let nativeDebugBuild = "native-debug-2026-05-20-01"

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
        let fallbackURL = "http://127.0.0.1:3000/?native=ios&bridgeDebug=1"

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

    var debugLabel: String {
        switch self {
        case .loading:
            return "loading"
        case .ready:
            return "ready"
        case .failed(let reason):
            return "failed: \(reason)"
        }
    }
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

private enum NativeShellTheme: String {
    case dark
    case light

    var next: NativeShellTheme {
        self == .dark ? .light : .dark
    }

    var preferredColorScheme: ColorScheme {
        self == .dark ? .dark : .light
    }

    var toggleIcon: String {
        self == .dark ? "sun.max.fill" : "moon.fill"
    }

    var toggleLabel: String {
        self == .dark ? "切换浅色主题" : "切换深色主题"
    }

    var background: Color {
        self == .dark
            ? Color(red: 0.03, green: 0.04, blue: 0.035)
            : Color(red: 0.95, green: 0.97, blue: 0.94)
    }

    var surface: Color {
        self == .dark
            ? Color(red: 0.09, green: 0.11, blue: 0.10).opacity(0.86)
            : Color.white.opacity(0.88)
    }

    var elevatedSurface: Color {
        self == .dark
            ? Color(red: 0.08, green: 0.09, blue: 0.085).opacity(0.96)
            : Color(red: 0.99, green: 1.0, blue: 0.98).opacity(0.96)
    }

    var inset: Color {
        self == .dark ? Color.black.opacity(0.38) : Color(red: 0.90, green: 0.93, blue: 0.90)
    }

    var primary: Color {
        self == .dark
            ? Color(red: 0.03, green: 0.72, blue: 0.58)
            : Color(red: 0.03, green: 0.48, blue: 0.40)
    }

    var text: Color {
        self == .dark
            ? Color(red: 0.96, green: 0.98, blue: 0.96)
            : Color(red: 0.08, green: 0.13, blue: 0.11)
    }

    var muted: Color {
        self == .dark
            ? Color(red: 0.66, green: 0.70, blue: 0.68)
            : Color(red: 0.36, green: 0.42, blue: 0.38)
    }

    var softStroke: Color {
        self == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.08)
    }

    var overlay: Color {
        self == .dark ? Color.black.opacity(0.34) : Color.black.opacity(0.18)
    }
}

struct HybridShellView: View {
    let configuration: HybridShellConfiguration

    @State private var activePanel: NativeDrawerPanel?
    @State private var bridgeEvent: NativeBridgeOutboundEvent?
    @State private var draftText = ""
    @State private var inputMode: NativeComposerMode = .voice
    @State private var diagnostics = WebViewDiagnostics()
    @State private var loadState: WebViewLoadState = .loading
    @State private var selectedTimelineDate = "20"
    @State private var theme: NativeShellTheme = .dark

    private var bridgeDebugEnabled: Bool {
        configuration.h5URL.absoluteString.contains("bridgeDebug=1")
    }

    var body: some View {
        ZStack {
            theme.background
                .ignoresSafeArea()

            VStack(spacing: 0) {
                NativeShellHeader(
                    activePanel: activePanel,
                    theme: theme,
                    onCalendar: {
                        openPanel(.calendar, source: "native.header.calendar")
                    },
                    onLedger: {
                        openPanel(.ledger, source: "native.header.ledger")
                    },
                    onMenu: {
                        openPanel(.timeline, source: "native.header.menu")
                    },
                    onThemeToggle: toggleTheme
                )

                if bridgeDebugEnabled {
                    NativeBridgeDebugBar(
                        diagnostics: diagnostics,
                        h5URL: configuration.h5URL,
                        loadState: loadState,
                        theme: theme
                    )
                }

                H5WebView(
                    url: configuration.h5URL,
                    diagnostics: $diagnostics,
                    loadState: $loadState,
                    outboundEvent: bridgeEvent
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                NativeComposerBar(
                    draftText: $draftText,
                    mode: $inputMode,
                    theme: theme,
                    onCamera: {
                        submitNativeText("这是一张会议截图，帮我识别里面的时间并创建日程", source: "native.composer.camera")
                    },
                    onSubmit: {
                        submitDraftText()
                    },
                    onVoice: {
                        submitNativeText("明天下午三点安排一个新年业务规划会，时间一个半小时", source: "native.composer.voice")
                    }
                )
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 12)
            }

            if loadState != .ready {
                NativeShellOverlay(
                    loadState: loadState,
                    theme: theme,
                    title: configuration.title,
                    url: configuration.h5URL
                )
            }

            if let activePanel {
                NativeDrawerOverlay(
                    panel: activePanel,
                    selectedTimelineDate: $selectedTimelineDate,
                    theme: theme,
                    onClose: {
                        closePanel()
                    },
                    onSelectPanel: { panel in
                        openPanel(panel, source: "native.drawer.quick-switch")
                    }
                )
                .transition(.move(edge: .leading).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.34, dampingFraction: 0.88), value: activePanel)
        .animation(.easeInOut(duration: 0.32), value: theme)
        .preferredColorScheme(theme.preferredColorScheme)
    }

    private func closePanel() {
        activePanel = nil
        sendViewChanged(.conversation, source: "native.drawer.close")
    }

    private func openPanel(_ panel: NativeDrawerPanel, source: String) {
        activePanel = panel
        sendViewChanged(panel.surface, source: source)
    }

    private func submitDraftText() {
        let text = draftText.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !text.isEmpty else {
            inputMode = .text
            return
        }

        draftText = ""
        submitNativeText(text, source: "native.composer.keyboard")
    }

    private func submitNativeText(_ text: String, source: String) {
        activePanel = nil
        inputMode = .text
        bridgeEvent = NativeBridgeOutboundEvent(
            payload: [
                "source": source,
                "text": text,
                "view": NativeSurface.conversation.rawValue,
            ],
            type: "native.inputSubmitted"
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

    private func toggleTheme() {
        let nextTheme = theme.next
        let nextEvent = NativeBridgeOutboundEvent(
            payload: [
                "source": "native.header.theme",
                "theme": nextTheme.rawValue,
            ],
            type: "native.themeChanged"
        )

        withAnimation(.easeInOut(duration: 0.32)) {
            theme = nextTheme
            bridgeEvent = nextEvent
        }
    }
}

private struct NativeShellHeader: View {
    let activePanel: NativeDrawerPanel?
    let theme: NativeShellTheme
    let onCalendar: () -> Void
    let onLedger: () -> Void
    let onMenu: () -> Void
    let onThemeToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            NativeIconButton(
                isSelected: activePanel == .timeline,
                systemName: "line.3.horizontal",
                theme: theme,
                action: onMenu
            )

            VStack(spacing: 2) {
                Text(activePanel?.title ?? "AI 日程执行")
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundStyle(theme.text)

                Text(activePanel == nil ? "对话驱动 · 内部日历" : "Native Drawer · H5 同步内容")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.muted)
            }
            .frame(maxWidth: .infinity)

            HStack(spacing: 8) {
                NativeIconButton(systemName: theme.toggleIcon, theme: theme, action: onThemeToggle)
                NativeIconButton(
                    isSelected: activePanel == .ledger,
                    systemName: "clock",
                    theme: theme,
                    action: onLedger
                )
                NativeIconButton(
                    isSelected: activePanel == .calendar,
                    systemName: "calendar",
                    theme: theme,
                    action: onCalendar
                )
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(
            LinearGradient(
                colors: [
                    theme.background.opacity(0.98),
                    theme.background.opacity(0.72),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .accessibilityLabel("原生顶部导航")
    }
}

private struct NativeIconButton: View {
    var isSelected = false
    let systemName: String
    let theme: NativeShellTheme
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(isSelected ? theme.primary : theme.text)
                .frame(width: 42, height: 42)
                .background(.ultraThinMaterial)
                .background(isSelected ? theme.primary.opacity(0.18) : theme.surface)
                .clipShape(Circle())
                .overlay(Circle().stroke(theme.softStroke, lineWidth: 1))
                .shadow(color: .black.opacity(theme == .dark ? 0.24 : 0.08), radius: 12, x: 0, y: 8)
        }
        .buttonStyle(.plain)
    }
}

private enum NativeComposerMode {
    case text
    case voice
}

private struct NativeComposerBar: View {
    @Binding var draftText: String
    @Binding var mode: NativeComposerMode

    let theme: NativeShellTheme
    let onCamera: () -> Void
    let onSubmit: () -> Void
    let onVoice: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            NativeIconButton(systemName: "camera.fill", theme: theme, action: onCamera)

            if mode == .text {
                HStack(spacing: 8) {
                    TextField("输入你的日程指令", text: $draftText)
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(theme.text)
                        .textInputAutocapitalization(.never)
                        .submitLabel(.send)
                        .onSubmit(onSubmit)

                    Button(action: onSubmit) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(draftText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? theme.muted : theme.primary)
                    }
                    .buttonStyle(.plain)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .padding(.horizontal, 14)
                .background(theme.inset)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(theme.softStroke, lineWidth: 1))
            } else {
                Button(action: onVoice) {
                    Text("按住说话")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundStyle(theme.text)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(theme.inset)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(theme.softStroke, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }

            NativeIconButton(
                isSelected: mode == .text,
                systemName: mode == .text ? "mic.fill" : "keyboard",
                theme: theme,
                action: {
                    mode = mode == .text ? .voice : .text
                }
            )
        }
    }
}

private struct NativeDrawerOverlay: View {
    let panel: NativeDrawerPanel
    @Binding var selectedTimelineDate: String
    let theme: NativeShellTheme
    let onClose: () -> Void
    let onSelectPanel: (NativeDrawerPanel) -> Void

    var body: some View {
        ZStack(alignment: .leading) {
            theme.overlay
                .ignoresSafeArea()
                .onTapGesture(perform: onClose)

            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(panel.title)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundStyle(theme.text)

                        Text("由 iOS 原生壳控制，H5 同步内容元素")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(theme.muted)
                    }

                    Spacer()

                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundStyle(theme.text)
                            .frame(width: 46, height: 46)
                            .background(.ultraThinMaterial)
                            .background(theme.surface)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(theme.softStroke, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .contentShape(Circle())
                    .accessibilityLabel("关闭抽屉")
                }

                NativeDrawerSegmentedControl(
                    activePanel: panel,
                    theme: theme,
                    onSelect: onSelectPanel
                )

                switch panel {
                case .calendar:
                    NativeCalendarSummary(theme: theme)
                case .ledger:
                    NativeLedgerSummary(theme: theme)
                case .timeline:
                    NativeTimepageTimeline(
                        selectedDate: $selectedTimelineDate,
                        theme: theme
                    )
                }
            }
            .padding(18)
            .frame(width: 340)
            .frame(maxHeight: .infinity, alignment: .top)
            .background(.ultraThinMaterial)
            .background(theme.elevatedSurface)
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 0,
                    bottomLeadingRadius: 0,
                    bottomTrailingRadius: 28,
                    topTrailingRadius: 28,
                    style: .continuous
                )
            )
            .shadow(color: .black.opacity(theme == .dark ? 0.34 : 0.16), radius: 30, x: 16, y: 0)
            .ignoresSafeArea(edges: .vertical)
        }
    }
}

private struct NativeDrawerSegmentedControl: View {
    let activePanel: NativeDrawerPanel
    let theme: NativeShellTheme
    let onSelect: (NativeDrawerPanel) -> Void

    var body: some View {
        HStack(spacing: 6) {
            drawerButton(.timeline, title: "Timeline")
            drawerButton(.calendar, title: "日历")
            drawerButton(.ledger, title: "记录")
        }
        .padding(4)
        .background(theme.inset)
        .clipShape(Capsule())
    }

    private func drawerButton(_ panel: NativeDrawerPanel, title: String) -> some View {
        Button {
            onSelect(panel)
        } label: {
            Text(title)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(activePanel == panel ? Color.white : theme.muted)
                .frame(maxWidth: .infinity)
                .frame(height: 32)
                .background(activePanel == panel ? theme.primary : Color.clear)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct NativeTimelineEvent: Identifiable {
    let id: String
    let title: String
    let time: String
    let tone: Color
}

private struct NativeTimelineDay: Identifiable {
    let id: String
    let weekday: String
    let date: String
    let events: [NativeTimelineEvent]
}

private struct NativeTimepageTimeline: View {
    @Binding var selectedDate: String
    let theme: NativeShellTheme

    private var days: [NativeTimelineDay] {
        [
            NativeTimelineDay(
                id: "20",
                weekday: "周三",
                date: "20",
                events: [
                    NativeTimelineEvent(id: "standup", title: "团队站会", time: "09:30 -> 10:00", tone: .blue),
                    NativeTimelineEvent(id: "review", title: "设计 Review", time: "16:00 -> 17:00", tone: theme.primary),
                ]
            ),
            NativeTimelineDay(
                id: "21",
                weekday: "周四",
                date: "21",
                events: [
                    NativeTimelineEvent(id: "planning", title: "新年业务规划会", time: "15:00 -> 16:30", tone: .orange),
                    NativeTimelineEvent(id: "retro", title: "复盘整理", time: "19:30 -> 20:30", tone: .green),
                ]
            ),
            NativeTimelineDay(
                id: "22",
                weekday: "周五",
                date: "22",
                events: [
                    NativeTimelineEvent(id: "one-on-one", title: "1:1 沟通", time: "14:00 -> 14:30", tone: .blue),
                ]
            ),
            NativeTimelineDay(
                id: "23",
                weekday: "周六",
                date: "23",
                events: [
                    NativeTimelineEvent(id: "free", title: "自由安排", time: "全天", tone: .green),
                ]
            ),
        ]
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 10) {
                Text("2026 五月")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(theme.primary)
                    .rotationEffect(.degrees(-90))
                    .frame(width: 28, height: 94)

                Rectangle()
                    .fill(theme.primary.opacity(0.45))
                    .frame(width: 2)
            }

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 10) {
                    ForEach(days) { day in
                        Button {
                            selectedDate = day.date
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(spacing: 2) {
                                    Text(day.weekday)
                                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                                        .foregroundStyle(theme.muted)
                                    Text(day.date)
                                        .font(.system(size: 26, weight: .bold, design: .rounded))
                                        .foregroundStyle(selectedDate == day.date ? theme.background : theme.text)
                                        .frame(width: 48, height: 54)
                                        .background(selectedDate == day.date ? theme.text : Color.clear)
                                        .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                                }
                                .frame(width: 52)

                                VStack(alignment: .leading, spacing: 9) {
                                    ForEach(day.events) { event in
                                        HStack(alignment: .top, spacing: 8) {
                                            RoundedRectangle(cornerRadius: 4)
                                                .fill(event.tone)
                                                .frame(width: 4, height: 34)

                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(event.title)
                                                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                                                    .foregroundStyle(theme.text)
                                                Text(event.time)
                                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                                    .foregroundStyle(theme.muted)
                                            }
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(12)
                            .background(selectedDate == day.date ? theme.primary.opacity(0.14) : theme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .stroke(selectedDate == day.date ? theme.primary.opacity(0.45) : theme.softStroke, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

private struct NativeCalendarSummary: View {
    let theme: NativeShellTheme

    private let items = [
        ("今天 4 项安排", "calendar"),
        ("明天 1 项待确认", "calendar.badge.clock"),
        ("本周仍有 3.5h 可用时间", "clock.badge.checkmark"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(items, id: \.0) { item in
                Button {} label: {
                    HStack {
                        Image(systemName: item.1)
                            .foregroundStyle(theme.primary)
                        Text(item.0)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(theme.text)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(theme.muted)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(theme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(theme.softStroke, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private struct NativeLedgerSummary: View {
    let theme: NativeShellTheme

    private let items: [(title: String, done: Bool)] = [
        ("解析时间表达", true),
        ("生成确认卡片", true),
        ("等待用户确认", false),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(items, id: \.title) { item in
                HStack {
                    Image(systemName: item.done ? "checkmark.circle.fill" : "clock.fill")
                        .foregroundStyle(item.done ? theme.primary : .orange)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.title)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(theme.text)
                        Text(item.done ? "已完成" : "确认后写入内部日历")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(theme.muted)
                    }
                    Spacer()
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(theme.softStroke, lineWidth: 1))
            }
        }
    }
}

private struct NativeBridgeDebugBar: View {
    let diagnostics: WebViewDiagnostics
    let h5URL: URL
    let loadState: WebViewLoadState
    let theme: NativeShellTheme

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 7) {
                Text("Native Debug")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                Text(loadState.debugLabel)
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(theme.primary.opacity(0.14))
                    .clipShape(Capsule())
            }
            .foregroundStyle(theme.primary)

            HStack(spacing: 6) {
                debugPill(diagnostics.hydrationState)
                debugPill(diagnostics.bridgeState)
                debugPill(diagnostics.errorState)
            }

            Text(diagnostics.debugBuild)
                .font(.system(size: 9, weight: .medium, design: .monospaced))
                .foregroundStyle(theme.primary)

            Text("\(diagnostics.lastProbe) · \(h5URL.host ?? "local")")
                .font(.system(size: 9, weight: .medium, design: .monospaced))
                .foregroundStyle(theme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 92, alignment: .topLeading)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(theme.inset.opacity(0.92))
        .overlay(Rectangle().fill(theme.softStroke).frame(height: 1), alignment: .bottom)
        .transaction { transaction in
            transaction.animation = nil
        }
    }

    private func debugPill(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 9, weight: .semibold, design: .monospaced))
            .foregroundStyle(theme.muted)
            .lineLimit(1)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(theme.surface.opacity(0.84))
            .clipShape(Capsule())
    }
}

private struct NativeShellOverlay: View {
    let loadState: WebViewLoadState
    let theme: NativeShellTheme
    let title: String
    let url: URL

    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .tint(theme.primary)
                .opacity(loadState == .loading ? 1 : 0)

            VStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                    .foregroundStyle(theme.text)

                Text(message)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.muted)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 22)
        .background(.ultraThinMaterial)
        .background(theme.surface)
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
