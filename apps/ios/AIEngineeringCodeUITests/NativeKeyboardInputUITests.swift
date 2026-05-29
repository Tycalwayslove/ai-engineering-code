import XCTest

final class NativeKeyboardInputUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testNativeKeyboardComposerSubmitsThroughH5Bridge() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--ai-code-ui-test-disable-system-permission-requests"]
        app.launchEnvironment["AI_CODE_UI_TEST_DISABLE_SYSTEM_PERMISSION_REQUESTS"] = "1"
        app.launch()

        let modeToggle = app.buttons["ai-code.composer.mode-toggle-button"]
        XCTAssertTrue(modeToggle.waitForExistence(timeout: 20), app.debugDescription)

        let keyboardField = app.textFields["ai-code.composer.keyboard-text-field"]
        if !keyboardField.exists {
            modeToggle.tap()
        }

        XCTAssertTrue(keyboardField.waitForExistence(timeout: 5), app.debugDescription)
        keyboardField.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), app.debugDescription)

        let inputText = "明天上午十点提醒我带电脑"
        keyboardField.typeText(inputText)

        let submitButton = app.buttons["ai-code.composer.submit-button"]
        XCTAssertTrue(submitButton.waitForExistence(timeout: 5), app.debugDescription)
        submitButton.tap()

        let inboundPredicate = NSPredicate(
            format: "label CONTAINS %@",
            "source=native.composer.keyboard"
        )
        let inboundMarker = app.staticTexts.matching(inboundPredicate).firstMatch
        XCTAssertTrue(inboundMarker.waitForExistence(timeout: 15), app.debugDescription)

        let submittedText = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", inputText)
        ).firstMatch
        XCTAssertTrue(submittedText.waitForExistence(timeout: 15), app.debugDescription)
    }
}
