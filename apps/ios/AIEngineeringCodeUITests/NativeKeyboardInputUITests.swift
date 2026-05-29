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
