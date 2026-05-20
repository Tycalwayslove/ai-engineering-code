package com.aiengineeringcode.shell

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var overlay: FrameLayout
    private lateinit var overlayMessage: TextView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        val root = FrameLayout(this).apply {
            setBackgroundColor(ShellStyle.background)
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.TRANSPARENT)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            overScrollMode = View.OVER_SCROLL_NEVER
            addJavascriptInterface(NativeBridge(), "NativeBridge")
            webViewClient = ShellWebViewClient()
        }

        overlay = createOverlay()
        root.addView(webView, matchParentLayoutParams())
        root.addView(overlay, matchParentLayoutParams())

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(0, systemBars.top, 0, systemBars.bottom)
            insets
        }

        setContentView(root)
        loadH5()
    }

    private fun loadH5() {
        overlay.visibility = View.VISIBLE
        overlayMessage.text = "正在加载 H5 产品层：${BuildConfig.H5_DEV_URL}"
        webView.loadUrl(BuildConfig.H5_DEV_URL)
    }

    private fun createOverlay(): FrameLayout {
        val container = FrameLayout(this).apply {
            setBackgroundColor(ShellStyle.background)
            isClickable = true
        }

        val card = FrameLayout(this).apply {
            setBackgroundColor(ShellStyle.surface)
            elevation = 18f
            setPadding(40, 36, 40, 36)
        }

        val progress = ProgressBar(this).apply {
            indeterminateTintList = android.content.res.ColorStateList.valueOf(ShellStyle.primary)
        }

        val title = TextView(this).apply {
            text = "AI Native Shell"
            setTextColor(ShellStyle.text)
            textSize = 18f
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }

        overlayMessage = TextView(this).apply {
            setTextColor(ShellStyle.muted)
            textSize = 13f
            gravity = Gravity.CENTER
        }

        val stack = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 0)
            addView(progress, wrapContentLayoutParams())
            addView(title, wrapContentLayoutParams(topMargin = 18))
            addView(overlayMessage, wrapContentLayoutParams(topMargin = 8))
        }

        card.addView(stack, centeredLayoutParams())
        container.addView(card, centeredCardLayoutParams())
        return container
    }

    private fun matchParentLayoutParams() = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
    )

    private fun centeredLayoutParams() = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER,
    )

    private fun centeredCardLayoutParams() = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER,
    ).apply {
        marginStart = 32
        marginEnd = 32
    }

    private fun wrapContentLayoutParams(topMargin: Int = 0) =
        android.widget.LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        ).apply {
            this.topMargin = topMargin
            gravity = Gravity.CENTER_HORIZONTAL
        }

    inner class ShellWebViewClient : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
            overlay.visibility = View.GONE
        }

        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?,
        ) {
            if (request?.isForMainFrame == true) {
                overlay.visibility = View.VISIBLE
                overlayMessage.text = "H5 加载失败：${error?.description ?: "未知错误"}"
            }
        }
    }

    class NativeBridge {
        @JavascriptInterface
        fun postMessage(payload: String) {
            android.util.Log.d("NativeBridge", payload)
        }
    }
}

private object ShellStyle {
    val background: Int = Color.rgb(8, 10, 9)
    val surface: Int = Color.rgb(29, 34, 32)
    val primary: Int = Color.rgb(8, 184, 148)
    val text: Int = Color.rgb(244, 247, 245)
    val muted: Int = Color.rgb(165, 174, 169)
}
