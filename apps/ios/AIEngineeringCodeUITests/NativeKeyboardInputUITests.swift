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
        XCTAssertTrue(
            waitForStaticText(containing: inputText, in: app, timeout: 10),
            app.debugDescription
        )
        attachScreenshot(named: "识别文本", in: app)

        confirmReminderFact(inputText, source: "source=native.composer.voice", in: app)
    }

    func testNativeVoicePermissionPromptCanBeCaptured() throws {
        let app = launchAppForPermissionPrompt(
            conversationPrefix: "conversation_ui_voice_permission",
            disableCalendarPermissionRequests: true,
            disableNotificationPermissionRequests: true
        )

        let voiceButton = app.buttons["ai-code.composer.voice-button"]
        XCTAssertTrue(voiceButton.waitForExistence(timeout: 20), app.debugDescription)
        voiceButton.tap()

        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let alert = springboard.alerts.firstMatch
        XCTAssertTrue(
            alert.waitForExistence(timeout: 15),
            "\(app.debugDescription)\n\(springboard.debugDescription)"
        )
        attachScreenshot(named: "麦克风 / 语音识别权限弹窗", in: springboard)
        attachScreenshot(named: "iOS 权限弹窗截图或录屏", in: springboard)

        let allowButton = permissionAllowButton(in: springboard)
        if allowButton.exists {
            allowButton.tap()
        }

        Thread.sleep(forTimeInterval: 1)
        let followUpAlert = springboard.alerts.firstMatch
        if followUpAlert.exists {
            attachScreenshot(named: "麦克风 / 语音识别权限弹窗", in: springboard)
            let followUpAllowButton = permissionAllowButton(in: springboard)
            if followUpAllowButton.exists {
                followUpAllowButton.tap()
            }
        }
    }

    func testNativeNotificationDeliveryAndClickCanBeCaptured() throws {
        let inputText = "1分钟后提醒我查看系统通知"
        let app = launchAppForPermissionPrompt(
            conversationPrefix: "conversation_ui_notification",
            disableCalendarPermissionRequests: true
        )

        submitKeyboardReminder(inputText, in: app)
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

        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if optionalSystemAlert(in: springboard, timeout: 8).exists {
            attachScreenshot(named: "iOS 通知权限弹窗截图", in: springboard)
            let allowButton = permissionAllowButton(in: springboard)
            XCTAssertTrue(allowButton.exists, springboard.debugDescription)
            allowButton.tap()
        }

        XCTAssertTrue(
            waitForStaticText(containing: "已执行：创建提醒", in: app, timeout: 30),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "scheduled", in: app, timeout: 30),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "查看系统通知", in: app, timeout: 30),
            app.debugDescription
        )

        let notification = waitForNotificationElement(containing: "查看系统通知", in: springboard, timeout: 100)
        XCTAssertTrue(
            notification.exists,
            "\(app.debugDescription)\n\(springboard.debugDescription)"
        )
        attachScreenshot(named: "系统通知截图", in: springboard)
        notification.tap()

        XCTAssertTrue(
            waitForStaticText(containing: "已从系统通知打开提醒", in: app, timeout: 30),
            app.debugDescription
        )
        XCTAssertTrue(
            waitForStaticText(containing: "查看系统通知", in: app, timeout: 30),
            app.debugDescription
        )
        attachScreenshot(named: "通知点击后 App 回流", in: app)
    }

    func testNativeAttachmentButtonPresentsAttachmentChoices() throws {
        let app = launchApp(conversationPrefix: "conversation_ui_attachment")

        openAttachmentMenu(in: app)
        let photoButton = button(containing: "选择照片", in: app, timeout: 10)
        XCTAssertTrue(photoButton.exists, app.debugDescription)
        attachScreenshot(named: "附件菜单", in: app)
        photoButton.tap()
        Thread.sleep(forTimeInterval: 2)
        attachScreenshot(named: "PhotosPicker 选择流程", in: app)
        app.terminate()

        let fileApp = launchApp(conversationPrefix: "conversation_ui_attachment_file")
        openAttachmentMenu(in: fileApp)
        let fileButton = button(containing: "选择文件", in: fileApp, timeout: 10)
        XCTAssertTrue(fileButton.exists, fileApp.debugDescription)
        fileButton.tap()
        Thread.sleep(forTimeInterval: 2)
        attachScreenshot(named: "fileImporter 选择流程", in: fileApp)
        attachScreenshot(named: "PDF 选择流程", in: fileApp)
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
        attachScreenshot(named: "Header Timeline 切换截图", in: app)
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
            if route.surface == "settings" {
                attachScreenshot(named: "Drawer 设置切换截图", in: app)
            }
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

    private func attachScreenshot(named name: String, in app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
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
        if source == "source=native.composer.voice" {
            attachScreenshot(named: "H5 确认卡", in: app)
        }

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

    private func launchAppForPermissionPrompt(
        conversationPrefix: String,
        disableCalendarPermissionRequests: Bool = false,
        disableNotificationPermissionRequests: Bool = false
    ) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["AI_CODE_UI_TEST_CONVERSATION_ID"] =
            "\(conversationPrefix)_\(UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased())"
        if disableCalendarPermissionRequests {
            app.launchEnvironment["AI_CODE_UI_TEST_DISABLE_CALENDAR_PERMISSION_REQUESTS"] = "1"
        }
        if disableNotificationPermissionRequests {
            app.launchEnvironment["AI_CODE_UI_TEST_DISABLE_NOTIFICATION_PERMISSION_REQUESTS"] = "1"
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
        attachScreenshot(named: "输入框文本", in: app)

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

    private func openAttachmentMenu(in app: XCUIApplication) {
        let attachmentButton = app.buttons["ai-code.composer.attachment-button"]
        XCTAssertTrue(attachmentButton.waitForExistence(timeout: 20), app.debugDescription)
        attachmentButton.tap()
        XCTAssertTrue(button(containing: "选择照片", in: app, timeout: 10).exists, app.debugDescription)
        XCTAssertTrue(button(containing: "选择文件", in: app, timeout: 10).exists, app.debugDescription)
        XCTAssertTrue(button(containing: "取消", in: app, timeout: 10).exists, app.debugDescription)
        XCTAssertTrue(waitForStaticText(containing: "选择附件", in: app, timeout: 10), app.debugDescription)
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

    private func permissionAllowButton(in springboard: XCUIApplication) -> XCUIElement {
        for label in ["允许", "好", "OK", "Allow", "Continue"] {
            let button = springboard.buttons[label]
            if button.exists {
                return button
            }
        }

        return springboard.buttons.element(boundBy: max(springboard.buttons.count - 1, 0))
    }

    private func optionalSystemAlert(in springboard: XCUIApplication, timeout: TimeInterval) -> XCUIElement {
        let alert = springboard.alerts.firstMatch
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if alert.exists {
                return alert
            }
            Thread.sleep(forTimeInterval: 0.5)
        }
        return alert
    }

    private func waitForNotificationElement(
        containing text: String,
        in springboard: XCUIApplication,
        timeout: TimeInterval
    ) -> XCUIElement {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            let element = notificationElement(containing: text, in: springboard)
            if element.exists {
                return element
            }
            Thread.sleep(forTimeInterval: 0.5)
        }
        return notificationElement(containing: text, in: springboard)
    }

    private func notificationElement(containing text: String, in springboard: XCUIApplication) -> XCUIElement {
        let predicate = NSPredicate(
            format: "label CONTAINS %@ OR identifier CONTAINS %@ OR value CONTAINS %@",
            text,
            text,
            text
        )
        let button = springboard.buttons.matching(predicate).firstMatch
        if button.exists {
            return button
        }
        let staticText = springboard.staticTexts.matching(predicate).firstMatch
        if staticText.exists {
            return staticText
        }
        let banner = springboard
            .descendants(matching: .any)
            .matching(NSPredicate(format: "identifier == %@ AND label CONTAINS %@", "NotificationShortLookView", text))
            .firstMatch
        if banner.exists {
            return banner
        }
        return springboard.descendants(matching: .any).matching(predicate).firstMatch
    }
}
