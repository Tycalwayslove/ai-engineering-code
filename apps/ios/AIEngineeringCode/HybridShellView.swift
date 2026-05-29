import AVFoundation
import EventKit
import PDFKit
import PhotosUI
import Speech
import SwiftUI
import UserNotifications
import UniformTypeIdentifiers
import Vision

private let nativeDebugBuild = "native-debug-2026-05-20-01"
private let nativeAttachmentBase64LimitBytes = 5 * 1024 * 1024
private let nativeConversationIdStorageKey = "ai-code.native.conversationId"
private let nativeSystemDiagnosticsStorageKey = "ai-code.native.systemDiagnostics"

private enum NativeRuntimeFlags {
    static var disablesSystemPermissionRequests: Bool {
        ProcessInfo.processInfo.arguments.contains("--ai-code-ui-test-disable-system-permission-requests") ||
            ProcessInfo.processInfo.environment["AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS"] == "1"
    }
}

private enum NativeConversationIdentity {
    static var stableConversationId: String {
        if let stored = UserDefaults.standard.string(forKey: nativeConversationIdStorageKey),
           !stored.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return stored
        }

        let generated = "conversation_ios_\(UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased())"
        UserDefaults.standard.set(generated, forKey: nativeConversationIdStorageKey)
        return generated
    }

    static func attachConversationId(to url: URL) -> URL {
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return url
        }

        var queryItems = components.queryItems ?? []
        if queryItems.contains(where: { $0.name == "conversationId" }) {
            return url
        }

        queryItems.append(
            URLQueryItem(name: "conversationId", value: stableConversationId)
        )
        components.queryItems = queryItems
        return components.url ?? url
    }
}

struct HybridShellConfiguration {
    let title: String
    let h5URL: URL

    static let development = HybridShellConfiguration(
        title: "AI Native Shell",
        h5URL: NativeConversationIdentity.attachConversationId(
            to: URL(string: Bundle.main.h5DevServerURL)!
        )
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
    case expenses
    case ledger
    case reminders
    case settings
    case timeline
}

private enum NativeDrawerPanel: String, CaseIterable, Identifiable {
    case calendar
    case conversation
    case expenses
    case ledger
    case reminders
    case settings
    case timeline

    var id: String {
        rawValue
    }

    var surface: NativeSurface {
        switch self {
        case .calendar:
            return .calendar
        case .conversation:
            return .conversation
        case .expenses:
            return .expenses
        case .ledger:
            return .ledger
        case .reminders:
            return .reminders
        case .settings:
            return .settings
        case .timeline:
            return .timeline
        }
    }

    var title: String {
        switch self {
        case .calendar:
            return "完整日历"
        case .conversation:
            return "对话工作台"
        case .expenses:
            return "费用草稿"
        case .ledger:
            return "执行记录"
        case .reminders:
            return "提醒列表"
        case .settings:
            return "设置"
        case .timeline:
            return "Timepage"
        }
    }

    var menuTitle: String {
        switch self {
        case .calendar:
            return "日历"
        case .conversation:
            return "对话"
        case .expenses:
            return "费用"
        case .ledger:
            return "记录"
        case .reminders:
            return "提醒"
        case .settings:
            return "设置"
        case .timeline:
            return "Timeline"
        }
    }

    var iconName: String {
        switch self {
        case .calendar:
            return "calendar"
        case .conversation:
            return "bubble.left.and.bubble.right.fill"
        case .expenses:
            return "receipt.fill"
        case .ledger:
            return "clock"
        case .reminders:
            return "bell.fill"
        case .settings:
            return "gearshape.fill"
        case .timeline:
            return "list.bullet.rectangle"
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
    @State private var isAttachmentDialogPresented = false
    @State private var isFileImporterPresented = false
    @State private var isPhotoPickerPresented = false
    @State private var inputMode: NativeComposerMode = .voice
    @State private var isVoiceRecording = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var voiceStatusText = "点击说话"
    @State private var diagnostics = WebViewDiagnostics()
    @State private var loadState: WebViewLoadState = .loading
    @State private var selectedTimelineDate = "20"
    @State private var theme: NativeShellTheme = .dark
    @StateObject private var calendarEvents = NativeCalendarEventSyncer()
    @StateObject private var reminderNotifications = NativeReminderNotificationScheduler()
    @StateObject private var voiceInput = NativeSpeechInputController()
    @FocusState private var isComposerTextFocused: Bool

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
                        openPanel(.conversation, source: "native.header.menu")
                    },
                    onTimeline: {
                        openPanel(.timeline, source: "native.header.timeline")
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
                    outboundEvent: bridgeEvent,
                    onKeyboardInputRequested: {
                        openKeyboardInput()
                    },
                    onVoiceInputRequested: {
                        startVoiceInput()
                    },
                    onVoiceInputStopRequested: {
                        stopVoiceInputAndSubmit()
                    },
                    onCalendarEventsSyncRequested: { events in
                        syncCalendarEvents(events)
                    },
                    onReminderNotificationsSyncRequested: { reminders in
                        syncReminderNotifications(reminders)
                    }
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                NativeComposerBar(
                    draftText: $draftText,
                    mode: $inputMode,
                    isVoiceRecording: $isVoiceRecording,
                    textFieldFocus: $isComposerTextFocused,
                    voiceStatusText: voiceStatusText,
                    theme: theme,
                    onCamera: {
                        isAttachmentDialogPresented = true
                    },
                    onSubmit: {
                        submitDraftText()
                    },
                    onVoice: {
                        toggleVoiceInput()
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
        .confirmationDialog(
            "选择附件",
            isPresented: $isAttachmentDialogPresented,
            titleVisibility: .visible
        ) {
            Button("选择照片") {
                isPhotoPickerPresented = true
            }
            Button("选择文件") {
                isFileImporterPresented = true
            }
            Button("取消", role: .cancel) {}
        }
        .photosPicker(
            isPresented: $isPhotoPickerPresented,
            selection: $selectedPhotoItem,
            matching: .images
        )
        .fileImporter(
            isPresented: $isFileImporterPresented,
            allowedContentTypes: [.data, .image, .pdf, .plainText],
            allowsMultipleSelection: false,
            onCompletion: handleImportedFile
        )
        .onChange(of: selectedPhotoItem) { _, item in
            handleSelectedPhoto(item)
        }
        .onAppear {
            reminderNotifications.onReminderOpened = { reminderId in
                openReminderFromNotification(reminderId)
            }
        }
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
        isComposerTextFocused = false
        bridgeEvent = NativeBridgeOutboundEvent(
            payload: [
                "source": source,
                "text": text,
                "view": NativeSurface.conversation.rawValue,
            ],
            type: "native.inputSubmitted"
        )
    }

    private func openKeyboardInput() {
        activePanel = nil
        inputMode = .text

        if isVoiceRecording {
            _ = voiceInput.stop()
            isVoiceRecording = false
            voiceStatusText = "点击说话"
        }

        DispatchQueue.main.async {
            isComposerTextFocused = true
        }
    }

    private func submitNativeAttachment(
        name: String,
        kind: String,
        sizeBytes: Int?,
        source: String,
        typeIdentifier: String?,
        contentData data: Data? = nil,
        recognizedText: String? = nil
    ) {
        activePanel = nil
        inputMode = .text
        let sizeDescription = sizeBytes.map { "\($0) bytes" } ?? "大小未知"
        let baseText = "已选择附件：\(name)（\(kind)，\(sizeDescription)）。请根据附件继续处理日程、费用或提醒。"
        let trimmedRecognizedText = recognizedText?.trimmingCharacters(in: .whitespacesAndNewlines)
        let text = if let trimmedRecognizedText, !trimmedRecognizedText.isEmpty {
            "\(baseText)\n识别文本：\(trimmedRecognizedText)"
        } else {
            baseText
        }
        var payload = [
            "attachmentId": "native_attachment_\(UUID().uuidString)",
            "attachmentKind": kind,
            "attachmentName": name,
            "inputKind": "attachment",
            "source": source,
            "text": text,
            "view": NativeSurface.conversation.rawValue,
        ]

        if let typeIdentifier {
            payload["attachmentType"] = typeIdentifier
        }
        if let sizeBytes {
            payload["attachmentSizeBytes"] = "\(sizeBytes)"
        }
        if let data, data.count <= nativeAttachmentBase64LimitBytes {
            payload["base64Content"] = data.base64EncodedString()
        }

        bridgeEvent = NativeBridgeOutboundEvent(
            payload: payload,
            type: "native.inputSubmitted"
        )
    }

    private func recognizeText(inImageData data: Data?) async -> String? {
        guard let data else {
            return nil
        }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        request.recognitionLanguages = ["zh-Hans", "en-US"]

        do {
            let handler = VNImageRequestHandler(data: data)
            try handler.perform([request])
        } catch {
            return nil
        }

        let recognizedText = request.results?
            .compactMap { observation in
                observation.topCandidates(1).first?.string
            }
            .joined(separator: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return recognizedText?.isEmpty == false ? recognizedText : nil
    }

    private func recognizeText(
        inImportedFileData data: Data?,
        typeIdentifier: String?
    ) async -> String? {
        guard
            let data,
            let typeIdentifier,
            let type = UTType(typeIdentifier)
        else {
            return nil
        }

        if type.conforms(to: .image) {
            return await recognizeText(inImageData: data)
        }

        if type.conforms(to: .pdf) {
            return extractTextFromPDF(data)
        }

        return nil
    }

    private func extractTextFromPDF(_ data: Data) -> String? {
        guard let document = PDFDocument(data: data) else {
            return nil
        }

        let text = (0..<document.pageCount)
            .compactMap { pageIndex in
                document.page(at: pageIndex)?.string
            }
            .joined(separator: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return text.isEmpty ? nil : text
    }

    private func handleSelectedPhoto(_ item: PhotosPickerItem?) {
        guard let item else {
            return
        }

        selectedPhotoItem = nil
        let typeIdentifier = item.supportedContentTypes.first?.identifier

        Task {
            let data = try? await item.loadTransferable(type: Data.self)
            let recognizedText = await recognizeText(inImageData: data)
            await MainActor.run {
                submitNativeAttachment(
                    name: "照片附件",
                    kind: "image",
                    sizeBytes: data?.count,
                    source: "native.composer.attachment.photo",
                    typeIdentifier: typeIdentifier,
                    contentData: data,
                    recognizedText: recognizedText
                )
            }
        }
    }

    private func handleImportedFile(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else {
                return
            }

            let didAccess = url.startAccessingSecurityScopedResource()
            defer {
                if didAccess {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            let values = try? url.resourceValues(forKeys: [
                .contentTypeKey,
                .fileSizeKey,
                .localizedNameKey,
            ])
            let typeIdentifier = values?.contentType?.identifier ?? UTType(filenameExtension: url.pathExtension)?.identifier
            let fileData = values?.fileSize.map { $0 > nativeAttachmentBase64LimitBytes } == true
                ? nil
                : try? Data(contentsOf: url)
            Task {
                let recognizedText = await recognizeText(
                    inImportedFileData: fileData,
                    typeIdentifier: typeIdentifier
                )
                await MainActor.run {
                    submitNativeAttachment(
                        name: values?.localizedName ?? url.lastPathComponent,
                        kind: "file",
                        sizeBytes: values?.fileSize ?? fileData?.count,
                        source: "native.composer.attachment.file",
                        typeIdentifier: typeIdentifier,
                        contentData: fileData,
                        recognizedText: recognizedText
                    )
                }
            }
        case .failure:
            sendBridgeError("文件选择失败", source: "native.composer.attachment")
        }
    }

    private func toggleVoiceInput() {
        if isVoiceRecording {
            stopVoiceInputAndSubmit()
            return
        }

        startVoiceInput()
    }

    private func startVoiceInput() {
        guard !isVoiceRecording else {
            return
        }

        draftText = ""
        voiceStatusText = "正在请求权限..."
        voiceInput.start(
            onRecordingChanged: { recording in
                isVoiceRecording = recording
                voiceStatusText = recording ? "正在听..." : "点击说话"
            },
            onTranscript: { transcript in
                draftText = transcript
                voiceStatusText = transcript.isEmpty ? "正在听..." : transcript
            },
            onError: { message in
                isVoiceRecording = false
                voiceStatusText = message
                inputMode = .text
                sendBridgeError(message, source: "native.composer.voice")
            }
        )
    }

    private func stopVoiceInputAndSubmit() {
        let transcript = voiceInput.stop().trimmingCharacters(in: .whitespacesAndNewlines)
        isVoiceRecording = false
        voiceStatusText = "点击说话"

        guard !transcript.isEmpty else {
            inputMode = .text
            return
        }

        draftText = ""
        submitNativeText(transcript, source: "native.composer.voice")
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

    private func openReminderFromNotification(_ reminderId: String) {
        activePanel = .reminders
        bridgeEvent = NativeBridgeOutboundEvent(
            payload: [
                "reminderId": reminderId,
                "source": "native.notifications.reminders.opened",
                "view": NativeSurface.reminders.rawValue,
            ],
            type: "native.viewChanged"
        )
    }

    private func sendBridgeError(_ reason: String, source: String) {
        bridgeEvent = NativeBridgeOutboundEvent(
            payload: [
                "reason": reason,
                "source": source,
            ],
            type: "native.error"
        )
    }

    private func recordNativeSystemDiagnostics(_ nextDiagnostics: [String: String]) {
        var diagnostics = UserDefaults.standard.dictionary(
            forKey: nativeSystemDiagnosticsStorageKey
        ) as? [String: String] ?? [:]
        nextDiagnostics.forEach { key, value in
            diagnostics[key] = value
        }
        diagnostics["updatedAt"] = ISO8601DateFormatter().string(from: Date())
        UserDefaults.standard.set(diagnostics, forKey: nativeSystemDiagnosticsStorageKey)
    }

    private func syncReminderNotifications(_ payloads: [[String: String]]) {
        let reminders = payloads.compactMap(NativeReminderNotification.init(payload:))

        if NativeRuntimeFlags.disablesSystemPermissionRequests {
            let payload = [
                "inputReminderCount": "\(reminders.count)",
                "notifications.inputReminderCount": "\(reminders.count)",
                "notifications.lastSyncStatus": "skipped_for_ui_test",
                "reason": "ui_test_system_permission_requests_disabled",
                "source": "native.notifications.reminders.sync",
                "status": "skipped",
            ]
            recordNativeSystemDiagnostics(payload)
            bridgeEvent = NativeBridgeOutboundEvent(
                payload: payload,
                type: "native.ack"
            )
            return
        }

        reminderNotifications.sync(
            reminders: reminders,
            onSynced: { scheduledCount, skippedCount in
                reminderNotifications.snapshotDiagnostics { diagnostics in
                    var payload = diagnostics
                    payload.merge(
                        [
                            "notifications.scheduledCount": "\(scheduledCount)",
                            "notifications.skippedCount": "\(skippedCount)",
                            "scheduledCount": "\(scheduledCount)",
                            "skippedCount": "\(skippedCount)",
                            "source": "native.notifications.reminders.sync",
                            "status": "scheduled",
                        ],
                        uniquingKeysWith: { _, newValue in newValue }
                    )
                    recordNativeSystemDiagnostics(payload)
                    bridgeEvent = NativeBridgeOutboundEvent(
                        payload: payload,
                        type: "native.ack"
                    )
                }
            },
            onError: { message in
                reminderNotifications.snapshotDiagnostics { diagnostics in
                    var payload = diagnostics
                    payload.merge(
                        [
                            "lastError": message,
                            "notifications.lastError": message,
                            "notifications.lastSyncStatus": "failed",
                        ],
                        uniquingKeysWith: { _, newValue in newValue }
                    )
                    recordNativeSystemDiagnostics(payload)
                    sendBridgeError(message, source: "native.notifications.reminders.sync")
                }
            }
        )
    }

    private func syncCalendarEvents(_ payloads: [[String: String]]) {
        let events = payloads.compactMap(NativeCalendarEvent.init(payload:))

        if NativeRuntimeFlags.disablesSystemPermissionRequests {
            let payload = [
                "calendar.inputEventCount": "\(events.count)",
                "calendar.lastSyncStatus": "skipped_for_ui_test",
                "inputEventCount": "\(events.count)",
                "reason": "ui_test_system_permission_requests_disabled",
                "source": "native.calendar.events.sync",
                "status": "skipped",
            ]
            recordNativeSystemDiagnostics(payload)
            bridgeEvent = NativeBridgeOutboundEvent(
                payload: payload,
                type: "native.ack"
            )
            return
        }

        calendarEvents.sync(
            events: events,
            onSynced: { syncedCount, skippedCount in
                var payload = calendarEvents.diagnosticsSnapshot()
                payload.merge(
                    [
                        "inputEventCount": "\(events.count)",
                        "calendar.inputEventCount": "\(events.count)",
                        "calendar.skippedCount": "\(skippedCount)",
                        "calendar.syncedCount": "\(syncedCount)",
                        "skippedCount": "\(skippedCount)",
                        "source": "native.calendar.events.sync",
                        "status": "synced",
                        "syncedCount": "\(syncedCount)",
                    ],
                    uniquingKeysWith: { _, newValue in newValue }
                )
                recordNativeSystemDiagnostics(payload)
                bridgeEvent = NativeBridgeOutboundEvent(
                    payload: payload,
                    type: "native.ack"
                )
            },
            onError: { message in
                var payload = calendarEvents.diagnosticsSnapshot()
                payload["calendar.lastError"] = message
                payload["calendar.lastSyncStatus"] = "failed"
                payload["lastError"] = message
                recordNativeSystemDiagnostics(payload)
                sendBridgeError(message, source: "native.calendar.events.sync")
            }
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

private struct NativeCalendarEvent: Identifiable {
    let endAt: String
    let id: String
    let sourceActionId: String
    let startAt: String
    let status: String
    let timezone: String
    let title: String

    init?(payload: [String: String]) {
        guard
            let endAt = payload["endAt"],
            let id = payload["id"],
            let sourceActionId = payload["sourceActionId"],
            let startAt = payload["startAt"],
            let status = payload["status"],
            let timezone = payload["timezone"],
            let title = payload["title"],
            !endAt.isEmpty,
            !id.isEmpty,
            !startAt.isEmpty,
            !timezone.isEmpty,
            !title.isEmpty
        else {
            return nil
        }

        self.endAt = endAt
        self.id = id
        self.sourceActionId = sourceActionId
        self.startAt = startAt
        self.status = status
        self.timezone = timezone
        self.title = title
    }
}

private final class NativeCalendarEventSyncer: ObservableObject {
    private let eventStore = EKEventStore()
    private let eventIdentifierDefaultsPrefix = "AI_CODE_EK_EVENT_IDENTIFIER:"
    private let markerPrefix = "AI_CODE_EVENT_ID:"
    private var lastRemovedEventIds: [String] = []

    func sync(
        events: [NativeCalendarEvent],
        onSynced: @escaping (Int, Int) -> Void,
        onError: @escaping (String) -> Void
    ) {
        requestAccess { [weak self] granted in
            guard let self else {
                return
            }

            guard granted else {
                onError("未获得日历权限，日程已保存但不会写入系统日历")
                return
            }

            self.syncWithAccess(events: events, onSynced: onSynced, onError: onError)
        }
    }

    func diagnosticsSnapshot() -> [String: String] {
        let defaults = UserDefaults.standard.dictionaryRepresentation()
        let storedKeys = defaults.keys.filter { key in
            key.hasPrefix(eventIdentifierDefaultsPrefix)
        }
        let storedPairs = storedKeys.compactMap { key -> (backendId: String, eventIdentifier: String)? in
            guard let eventIdentifier = defaults[key] as? String else {
                return nil
            }
            let backendId = String(key.dropFirst(eventIdentifierDefaultsPrefix.count))
            return (backendId, eventIdentifier)
        }
        let storedBackendIds = storedPairs.map(\.backendId).sorted()
        let foundStoredBackendIds = storedPairs
            .filter { pair in eventStore.event(withIdentifier: pair.eventIdentifier) != nil }
            .map(\.backendId)
            .sorted()

        return [
            "calendar.authorizationStatus": authorizationStatusLabel(
                EKEventStore.authorizationStatus(for: .event)
            ),
            "calendar.foundStoredEventBackendIds": foundStoredBackendIds.joined(separator: ","),
            "calendar.foundStoredEventCount": "\(foundStoredBackendIds.count)",
            "calendar.removedEventIds": lastRemovedEventIds.sorted().joined(separator: ","),
            "calendar.storedEventBackendIds": storedBackendIds.joined(separator: ","),
            "calendar.storedEventIdentifierCount": "\(storedPairs.count)",
        ]
    }

    private func requestAccess(_ completion: @escaping (Bool) -> Void) {
        if #available(iOS 17.0, *) {
            eventStore.requestFullAccessToEvents { granted, _ in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        } else {
            eventStore.requestAccess(to: .event) { granted, _ in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        }
    }

    private func syncWithAccess(
        events: [NativeCalendarEvent],
        onSynced: @escaping (Int, Int) -> Void,
        onError: @escaping (String) -> Void
    ) {
        var skippedCount = 0
        var syncedCount = 0
        var removedEventIds: [String] = []
        do {
            for event in events {
                guard
                    let startDate = date(from: event.startAt),
                    let endDate = date(from: event.endAt),
                    endDate > startDate
                else {
                    skippedCount += 1
                    continue
                }

                if event.status != "scheduled" {
                    try removeInactiveEvent(event, startDate: startDate, endDate: endDate)
                    removedEventIds.append(event.id)
                    syncedCount += 1
                    continue
                }

                guard let calendar = eventStore.defaultCalendarForNewEvents else {
                    onError("未找到可写入的系统日历")
                    return
                }

                let timeZone = TimeZone(identifier: event.timezone) ?? TimeZone.current
                try removeExistingEvent(id: event.id, startDate: startDate, endDate: endDate)

                let calendarEvent = EKEvent(eventStore: eventStore)
                calendarEvent.calendar = calendar
                calendarEvent.endDate = endDate
                calendarEvent.notes = "Created by AI Code\n\(markerPrefix)\(event.id)\nAI_CODE_ACTION_ID:\(event.sourceActionId)"
                calendarEvent.startDate = startDate
                calendarEvent.timeZone = timeZone
                calendarEvent.title = event.title

                try eventStore.save(calendarEvent, span: .thisEvent, commit: true)
                if let eventIdentifier = calendarEvent.eventIdentifier {
                    UserDefaults.standard.set(
                        eventIdentifier,
                        forKey: storedIdentifierKey(id: event.id)
                    )
                }
                syncedCount += 1
            }
        } catch {
            onError("系统日历同步失败")
            return
        }

        lastRemovedEventIds = removedEventIds
        onSynced(syncedCount, skippedCount)
    }

    private func removeInactiveEvent(
        _ event: NativeCalendarEvent,
        startDate: Date,
        endDate: Date
    ) throws {
        try removeExistingEvent(id: event.id, startDate: startDate, endDate: endDate)
    }

    private func removeExistingEvent(id: String, startDate: Date, endDate: Date) throws {
        try removeStoredEvent(id: id)

        let calendar = Calendar.current
        let now = Date()
        let currentWindowStart = calendar.date(byAdding: .day, value: -1, to: startDate) ?? startDate
        let currentWindowEnd = calendar.date(byAdding: .day, value: 1, to: endDate) ?? endDate
        let broadWindowStart = calendar.date(byAdding: .year, value: -1, to: now) ?? currentWindowStart
        let broadWindowEnd = calendar.date(byAdding: .year, value: 3, to: now) ?? currentWindowEnd
        let searchStart = min(currentWindowStart, broadWindowStart)
        let searchEnd = max(currentWindowEnd, broadWindowEnd)
        let predicate = eventStore.predicateForEvents(
            withStart: searchStart,
            end: searchEnd,
            calendars: nil
        )
        let marker = "\(markerPrefix)\(id)"
        let matches = eventStore.events(matching: predicate).filter { event in
            event.notes?.contains(marker) == true
        }

        for event in matches {
            try eventStore.remove(event, span: .thisEvent, commit: true)
        }
    }

    private func removeStoredEvent(id: String) throws {
        let key = storedIdentifierKey(id: id)
        guard let eventIdentifier = UserDefaults.standard.string(forKey: key) else {
            return
        }

        if let event = eventStore.event(withIdentifier: eventIdentifier) {
            try eventStore.remove(event, span: .thisEvent, commit: true)
        }

        UserDefaults.standard.removeObject(forKey: key)
    }

    private func storedIdentifierKey(id: String) -> String {
        "\(eventIdentifierDefaultsPrefix)\(id)"
    }

    private func date(from rawValue: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: rawValue) {
            return date
        }

        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: rawValue)
    }

    private func authorizationStatusLabel(_ status: EKAuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "notDetermined"
        case .restricted:
            return "restricted"
        case .denied:
            return "denied"
        case .authorized:
            return "authorized"
        case .fullAccess:
            return "fullAccess"
        case .writeOnly:
            return "writeOnly"
        @unknown default:
            return "unknown"
        }
    }
}

private struct NativeShellHeader: View {
    let activePanel: NativeDrawerPanel?
    let theme: NativeShellTheme
    let onCalendar: () -> Void
    let onLedger: () -> Void
    let onMenu: () -> Void
    let onTimeline: () -> Void
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
                    isSelected: activePanel == .timeline,
                    systemName: "list.bullet.rectangle",
                    theme: theme,
                    action: onTimeline
                )
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

private final class NativeSpeechInputController: ObservableObject {
    private let audioEngine = AVAudioEngine()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh_CN"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var latestTranscript = ""

    func start(
        onRecordingChanged: @escaping (Bool) -> Void,
        onTranscript: @escaping (String) -> Void,
        onError: @escaping (String) -> Void
    ) {
        requestSpeechAuthorization { [weak self] speechAllowed in
            guard let self else {
                return
            }

            guard speechAllowed else {
                onError("未获得语音识别权限")
                return
            }

            requestMicrophoneAuthorization { [weak self] microphoneAllowed in
                guard let self else {
                    return
                }

                guard microphoneAllowed else {
                    onError("未获得麦克风权限")
                    return
                }

                self.startRecognition(
                    onRecordingChanged: onRecordingChanged,
                    onTranscript: onTranscript,
                    onError: onError
                )
            }
        }
    }

    func stop() -> String {
        stopAudio()
        return latestTranscript
    }

    private func requestSpeechAuthorization(_ completion: @escaping (Bool) -> Void) {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                completion(status == .authorized)
            }
        }
    }

    private func requestMicrophoneAuthorization(_ completion: @escaping (Bool) -> Void) {
        AVAudioApplication.requestRecordPermission { granted in
            DispatchQueue.main.async {
                completion(granted)
            }
        }
    }

    private func startRecognition(
        onRecordingChanged: @escaping (Bool) -> Void,
        onTranscript: @escaping (String) -> Void,
        onError: @escaping (String) -> Void
    ) {
        guard let speechRecognizer, speechRecognizer.isAvailable else {
            onError("当前语音识别不可用")
            return
        }

        stopAudio()
        latestTranscript = ""

        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            onError("无法启动麦克风")
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            request.append(buffer)
        }

        audioEngine.prepare()

        do {
            try audioEngine.start()
            onRecordingChanged(true)
        } catch {
            stopAudio()
            onError("无法开始录音")
            return
        }

        recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
            DispatchQueue.main.async {
                guard let self else {
                    return
                }

                if let result {
                    let transcript = result.bestTranscription.formattedString
                    self.latestTranscript = transcript
                    onTranscript(transcript)
                }

                if error != nil {
                    self.stopAudio()
                    if self.latestTranscript.isEmpty {
                        onError("语音识别中断")
                    } else {
                        onRecordingChanged(false)
                    }
                }
            }
        }
    }

    private func stopAudio() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }

        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

private struct NativeReminderNotification: Identifiable {
    let dueAt: String
    let id: String
    let status: String
    let title: String

    init?(payload: [String: String]) {
        guard
            let dueAt = payload["dueAt"],
            let id = payload["id"],
            let status = payload["status"],
            let title = payload["title"],
            !dueAt.isEmpty,
            !id.isEmpty,
            !title.isEmpty
        else {
            return nil
        }

        self.dueAt = dueAt
        self.id = id
        self.status = status
        self.title = title
    }
}

private final class NativeReminderNotificationScheduler: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    private let center = UNUserNotificationCenter.current()
    private let identifierPrefix = "ai-code.reminder."
    var onReminderOpened: ((String) -> Void)?

    override init() {
        super.init()
        center.delegate = self
    }

    func sync(
        reminders: [NativeReminderNotification],
        onSynced: @escaping (Int, Int) -> Void,
        onError: @escaping (String) -> Void
    ) {
        center.getPendingNotificationRequests { [weak self] requests in
            guard let self else {
                return
            }

            let existingIdentifiers = requests
                .map(\.identifier)
                .filter { $0.hasPrefix(self.identifierPrefix) }
            self.center.removePendingNotificationRequests(withIdentifiers: existingIdentifiers)

            self.center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                guard granted else {
                    DispatchQueue.main.async {
                        onError("未获得通知权限，提醒已保存但不会触发系统通知")
                    }
                    return
                }

                self.schedule(reminders: reminders, onSynced: onSynced, onError: onError)
            }
        }
    }

    func snapshotDiagnostics(_ completion: @escaping ([String: String]) -> Void) {
        center.getNotificationSettings { [weak self] settings in
            guard let self else {
                DispatchQueue.main.async {
                    completion([:])
                }
                return
            }

            self.center.getPendingNotificationRequests { pendingRequests in
                let pendingIds = pendingRequests
                    .map(\.identifier)
                    .filter { $0.hasPrefix(self.identifierPrefix) }
                    .sorted()

                self.center.getDeliveredNotifications { deliveredNotifications in
                    let deliveredIds = deliveredNotifications
                        .map(\.request.identifier)
                        .filter { $0.hasPrefix(self.identifierPrefix) }
                        .sorted()

                    DispatchQueue.main.async {
                        completion([
                            "notifications.authorizationStatus": self.authorizationStatusLabel(
                                settings.authorizationStatus
                            ),
                            "notifications.deliveredReminderCount": "\(deliveredIds.count)",
                            "notifications.deliveredReminderIds": deliveredIds.joined(separator: ","),
                            "notifications.pendingReminderCount": "\(pendingIds.count)",
                            "notifications.pendingReminderIds": pendingIds.joined(separator: ","),
                        ])
                    }
                }
            }
        }
    }

    private func schedule(
        reminders: [NativeReminderNotification],
        onSynced: @escaping (Int, Int) -> Void,
        onError: @escaping (String) -> Void
    ) {
        let scheduleTargets = reminders.compactMap { reminder -> (NativeReminderNotification, Date)? in
            guard
                reminder.status == "scheduled",
                let dueDate = date(from: reminder.dueAt),
                dueDate > Date()
            else {
                return nil
            }

            return (reminder, dueDate)
        }

        guard !scheduleTargets.isEmpty else {
            DispatchQueue.main.async {
                onSynced(0, reminders.count)
            }
            return
        }

        let group = DispatchGroup()
        var firstError: String?

        for (reminder, dueDate) in scheduleTargets {
            group.enter()
            let content = UNMutableNotificationContent()
            content.title = "AI 时间提醒"
            content.body = reminder.title
            content.sound = .default
            content.userInfo = [
                "reminderId": reminder.id,
                "source": "ai-code",
            ]

            let components = Calendar.current.dateComponents(
                [.year, .month, .day, .hour, .minute],
                from: dueDate
            )
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(
                identifier: "\(identifierPrefix)\(reminder.id)",
                content: content,
                trigger: trigger
            )

            center.add(request) { error in
                if error != nil, firstError == nil {
                    firstError = "系统通知调度失败"
                }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            if let firstError {
                onError(firstError)
                return
            }

            onSynced(scheduleTargets.count, reminders.count - scheduleTargets.count)
        }
    }

    private func date(from rawValue: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: rawValue) {
            return date
        }

        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: rawValue)
    }

    private func authorizationStatusLabel(_ status: UNAuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "notDetermined"
        case .denied:
            return "denied"
        case .authorized:
            return "authorized"
        case .provisional:
            return "provisional"
        case .ephemeral:
            return "ephemeral"
        @unknown default:
            return "unknown"
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // willPresent notification: keep reminders visible while the app is foregrounded.
        completionHandler([.banner, .sound])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // didReceive response: route notification taps back to the reminder surface.
        let userInfo = response.notification.request.content.userInfo
        let reminderId = userInfo["reminderId"] as? String ?? ""

        DispatchQueue.main.async { [weak self] in
            guard !reminderId.isEmpty else {
                completionHandler()
                return
            }

            self?.onReminderOpened?(reminderId)
            completionHandler()
        }
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
                .frame(width: 46, height: 46)
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
    @Binding var isVoiceRecording: Bool

    let textFieldFocus: FocusState<Bool>.Binding
    let voiceStatusText: String
    let theme: NativeShellTheme
    let onCamera: () -> Void
    let onSubmit: () -> Void
    let onVoice: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            NativeIconButton(systemName: "paperclip", theme: theme, action: onCamera)
                .accessibilityIdentifier("ai-code.composer.attachment-button")
                .accessibilityLabel("Attachments")

            if mode == .text {
                HStack(spacing: 8) {
                    TextField("输入日程、费用或提醒", text: $draftText)
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(theme.text)
                        .textInputAutocapitalization(.never)
                        .submitLabel(.send)
                        .onSubmit(onSubmit)
                        .focused(textFieldFocus)
                        .accessibilityIdentifier("ai-code.composer.keyboard-text-field")
                        .accessibilityLabel("输入日程、费用或提醒")

                    Button(action: onSubmit) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(draftText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? theme.muted : theme.primary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("ai-code.composer.submit-button")
                    .accessibilityLabel("发送")
                }
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .padding(.horizontal, 14)
                .background(theme.inset)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(theme.softStroke, lineWidth: 1))
            } else {
                Button(action: onVoice) {
                    Text(isVoiceRecording ? voiceStatusText : "点击说话")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundStyle(isVoiceRecording ? Color.white : theme.text)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(isVoiceRecording ? theme.primary : theme.inset)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(theme.softStroke, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("ai-code.composer.voice-button")
                .accessibilityLabel(isVoiceRecording ? voiceStatusText : "点击说话")
            }

            NativeIconButton(
                isSelected: mode == .text,
                systemName: mode == .text ? "mic.fill" : "keyboard",
                theme: theme,
                action: {
                    mode = mode == .text ? .voice : .text
                }
            )
            .accessibilityIdentifier("ai-code.composer.mode-toggle-button")
            .accessibilityLabel(mode == .text ? "切换到语音输入" : "切换到键盘输入")
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
                case .conversation:
                    NativeDrawerSummaryList(
                        items: [
                            ("自然语言对话", "键盘、语音和附件都会回到这里", "bubble.left.and.bubble.right.fill"),
                            ("确认卡", "H5 渲染计划，由你确认后执行", "checkmark.seal.fill"),
                        ],
                        theme: theme
                    )
                case .expenses:
                    NativeDrawerSummaryList(
                        items: [
                            ("附件选择", "纸夹入口会打开照片或文件选择器", "paperclip"),
                            ("状态", "确认后进入 H5 费用页面", "doc.text.fill"),
                        ],
                        theme: theme
                    )
                case .ledger:
                    NativeLedgerSummary(theme: theme)
                case .reminders:
                    NativeDrawerSummaryList(
                        items: [
                            ("带电脑", "语音识别后由后端生成确认卡", "bell.fill"),
                            ("通知", "确认后同步为 iOS 本地通知", "clock.badge.checkmark"),
                        ],
                        theme: theme
                    )
                case .settings:
                    NativeDrawerSummaryList(
                        items: [
                            ("主题", "Header 右侧按钮切换深浅色", "paintpalette.fill"),
                            ("Bridge", "支持 viewChanged / inputSubmitted", "arrow.left.arrow.right"),
                        ],
                        theme: theme
                    )
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
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 94), spacing: 8)], spacing: 8) {
            ForEach(NativeDrawerPanel.allCases) { panel in
                drawerButton(panel)
            }
        }
        .padding(6)
        .background(theme.inset)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func drawerButton(_ panel: NativeDrawerPanel) -> some View {
        Button {
            onSelect(panel)
        } label: {
            HStack(spacing: 6) {
                Image(systemName: panel.iconName)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                Text(panel.menuTitle)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .lineLimit(1)
            }
            .foregroundStyle(activePanel == panel ? Color.white : theme.muted)
            .frame(maxWidth: .infinity)
            .frame(height: 38)
            .background(activePanel == panel ? theme.primary : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct NativeDrawerSummaryList: View {
    let items: [(title: String, subtitle: String, icon: String)]
    let theme: NativeShellTheme

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(items, id: \.title) { item in
                HStack(spacing: 10) {
                    Image(systemName: item.icon)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.primary)
                        .frame(width: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.title)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(theme.text)
                        Text(item.subtitle)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(theme.muted)
                    }
                    Spacer(minLength: 0)
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
                HStack {
                    Image(systemName: item.1)
                        .foregroundStyle(theme.primary)
                    Text(item.0)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(theme.text)
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
