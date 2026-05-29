import XCTest

final class NativeKeyboardInputUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testNativeKeyboardComposerConfirmsReminderThroughBackend() throws {
        let inputText = "明天上午十点提醒我带电脑"
        let app = launchApp(conversationPrefix: "conversation_ui_keyboard")

        submitKeyboardReminder(inputText, in: app)
        confirmReminderFact(inputText, source: "source=native.composer.keyboard", in: app)
    }

    func testNativeVoiceComposerConfirmsReminderThroughBackend() throws {
        let inputText = "明天上午十点提醒我带电脑"
        let app = launchApp(
            conversationPrefix: "conversation_ui_voice",
            voiceTranscript: inputText
        )

        let voiceButton = app.buttons["ai-code.composer.voice-button"]
        XCTAssertTrue(voiceButton.waitForExistence(timeout: 20), app.debugDescription)
        voiceButton.tap()

        confirmReminderFact(inputText, source: "source=native.composer.voice", in: app)
    }

    func testNativeAttachmentButtonPresentsAttachmentChoices() throws {
        let app = launchApp(conversationPrefix: "conversation_ui_attachment")

        let attachmentButton = app.buttons["ai-code.composer.attachment-button"]
        XCTAssertTrue(attachmentButton.waitForExistence(timeout: 20), app.debugDescription)
        attachmentButton.tap()

        XCTAssertTrue(button(containing: "选择照片", in: app, timeout: 10).exists, app.debugDescription)
        XCTAssertTrue(button(containing: "选择文件", in: app, timeout: 10).exists, app.debugDescription)
        XCTAssertTrue(button(containing: "取消", in: app, timeout: 10).exists, app.debugDescription)
        XCTAssertTrue(waitForStaticText(containing: "选择附件", in: app, timeout: 10), app.debugDescription)
    }

    func testNativeHeaderAndDrawerNavigateH5Surfaces() throws {
        let app = launchApp(conversationPrefix: "conversation_ui_navigation")

        tapButton(withIdentifier: "ai-code.native.header.timeline-button", in: app)
        assertNativeNavigation(
            title: "Timepage",
            surface: "timeline",
            source: "native.header.timeline",
            in: app
        )
        closeDrawer(in: app)

        tapButton(withIdentifier: "ai-code.native.header.ledger-button", in: app)
        assertNativeNavigation(
            title: "执行记录",
            surface: "ledger",
            source: "native.header.ledger",
            in: app
        )
        closeDrawer(in: app)

        tapButton(withIdentifier: "ai-code.native.header.calendar-button", in: app)
        assertNativeNavigation(
            title: "完整日历",
            surface: "calendar",
            source: "native.header.calendar",
            in: app
        )
        closeDrawer(in: app)

        tapButton(withIdentifier: "ai-code.native.header.menu-button", in: app)
        assertNativeNavigation(
            title: "对话工作台",
            surface: "conversation",
            source: "native.header.menu",
            in: app
        )

        for route in drawerRoutes {
            tapButton(withIdentifier: route.identifier, in: app)
            assertNativeNavigation(
                title: route.title,
                surface: route.surface,
                source: "native.drawer.quick-switch",
                in: app
            )
        }
    }

    private var drawerRoutes: [(identifier: String, title: String, surface: String)] {
        [
            ("ai-code.native.drawer.timeline-button", "Timepage", "timeline"),
            ("ai-code.native.drawer.calendar-button", "完整日历", "calendar"),
            ("ai-code.native.drawer.expenses-button", "费用草稿", "expenses"),
            ("ai-code.native.drawer.reminders-button", "提醒列表", "reminders"),
            ("ai-code.native.drawer.ledger-button", "执行记录", "ledger"),
            ("ai-code.native.drawer.settings-button", "设置", "settings"),
            ("ai-code.native.drawer.conversation-button", "对话工作台", "conversation"),
        ]
    }

    private func assertNativeNavigation(
        title: String,
        surface: String,
        source: String,
        in app: XCUIApplication
    ) {
        XCTAssertTrue(
            waitForStaticText(containing: title, in: app, timeout: 15),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "source=\(source)", in: app, timeout: 15),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "view=\(surface)", in: app, timeout: 15),
            app.debugDescription
        )
    }

    private func closeDrawer(in app: XCUIApplication) {
        tapButton(withIdentifier: "ai-code.native.drawer.close-button", in: app)
        XCTAssertTrue(
            waitForStaticText(containing: "source=native.drawer.close", in: app, timeout: 10),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "view=conversation", in: app, timeout: 10),
            app.debugDescription
        )
    }

    private func confirmReminderFact(
        _ inputText: String,
        source: String,
        in app: XCUIApplication
    ) {
        XCTAssertTrue(
            waitForStaticText(containing: source, in: app, timeout: 15),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: inputText, in: app, timeout: 15),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "请确认执行计划", in: app, timeout: 30),
            app.debugDescription
        )

        let confirmButton = button(containing: "确认", in: app, timeout: 30)
        XCTAssertTrue(confirmButton.exists, app.debugDescription)
        if !confirmButton.isHittable {
            app.swipeUp()
        }
        confirmButton.tap()

        XCTAssertTrue(
            waitForStaticText(containing: "已确认执行", in: app, timeout: 30),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "已创建提醒", in: app, timeout: 30),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "带电脑", in: app, timeout: 30),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "scheduled", in: app, timeout: 30),
            app.debugDescription
        )
    }

    private func launchApp(
        conversationPrefix: String,
        voiceTranscript: String? = nil
    ) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--ai-code-ui-test-disable-system-permission-requests"]
        app.launchEnvironment["AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS"] = "1"
        app.launchEnvironment["AI_CODE_UI_TEST_CONVERSATION_ID"] =
            "\(conversationPrefix)_\(UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased())"
        if let voiceTranscript {
            app.launchEnvironment["AI_CODE_UI_TEST_VOICE_TRANSCRIPT"] = voiceTranscript
        }
        app.launch()
        return app
    }

    private func submitKeyboardReminder(_ inputText: String, in app: XCUIApplication) {
        let modeToggle = app.buttons["ai-code.composer.mode-toggle-button"]
        XCTAssertTrue(modeToggle.waitForExistence(timeout: 20), app.debugDescription)

        let keyboardField = app.textFields["ai-code.composer.keyboard-text-field"]
        if !keyboardField.exists {
            modeToggle.tap()
        }

        XCTAssertTrue(keyboardField.waitForExistence(timeout: 5), app.debugDescription)
        keyboardField.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), app.debugDescription)

        keyboardField.typeText(inputText)

        let submitButton = app.buttons["ai-code.composer.submit-button"]
        XCTAssertTrue(submitButton.waitForExistence(timeout: 5), app.debugDescription)
        submitButton.tap()
    }

    private func tapButton(withIdentifier identifier: String, in app: XCUIApplication) {
        let target = app.buttons[identifier]
        XCTAssertTrue(target.waitForExistence(timeout: 20), app.debugDescription)
        if !target.isHittable {
            app.swipeDown()
        }
        target.tap()
    }

    private func waitForStaticText(
        containing text: String,
        in app: XCUIApplication,
        timeout: TimeInterval
    ) -> Bool {
        app.staticTexts
            .matching(NSPredicate(format: "label CONTAINS %@", text))
            .firstMatch
            .waitForExistence(timeout: timeout)
    }

    private func button(
        containing label: String,
        in app: XCUIApplication,
        timeout: TimeInterval
    ) -> XCUIElement {
        let button = app.buttons
            .matching(NSPredicate(format: "label CONTAINS %@", label))
            .firstMatch
        _ = button.waitForExistence(timeout: timeout)
        return button
    }
}
