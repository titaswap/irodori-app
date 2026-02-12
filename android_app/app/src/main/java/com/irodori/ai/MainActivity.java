package com.irodori.ai;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Keep;
import androidx.appcompat.app.AppCompatActivity;

import java.util.Locale;

public class MainActivity extends AppCompatActivity implements TextToSpeech.OnInitListener {

    private static final String TAG = "IRODORI_WEBVIEW";
    private WebView webView;
    private ProgressBar progressBar;
    private RelativeLayout splashScreen;
    
    private ValueCallback<Uri[]> uploadMessage;
    public static final int FILECHOOSER_RESULTCODE = 1;
    
    private TextToSpeech tts;
    private static final String UTTERANCE_ID = "NATIVE_TTS_ID";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize UI Elements
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        splashScreen = findViewById(R.id.splashScreen);

        // Initialize TTS
        tts = new TextToSpeech(this, this);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);

        // Inject Native Interface (TTS Only)
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");

        // Cookies
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) {
                    return false;
                } else {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Cannot handle this link", Toast.LENGTH_SHORT).show();
                    }
                    return true;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // Hide splash screen when page loads
                if (splashScreen.getVisibility() == View.VISIBLE) {
                     splashScreen.setVisibility(View.GONE);
                }
                super.onPageFinished(view, url);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    progressBar.setVisibility(View.VISIBLE);
                }
            }
            
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                    uploadMessage = null;
                }
                uploadMessage = filePathCallback;
                try {
                    startActivityForResult(fileChooserParams.createIntent(), FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    uploadMessage = null;
                    Toast.makeText(MainActivity.this, "Cannot Open File Chooser", Toast.LENGTH_LONG).show();
                    return false;
                }
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                String cookies = CookieManager.getInstance().getCookie(url);
                request.addRequestHeader("cookie", cookies);
                request.addRequestHeader("User-Agent", userAgent);
                request.setMimeType(mimetype);
                String fileName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype);
                request.setTitle(fileName);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), "Downloading: " + fileName, Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(getApplicationContext(), "Download Failed", Toast.LENGTH_LONG).show();
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                 if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    MainActivity.super.onBackPressed();
                }
            }
        });
        
        WebView.setWebContentsDebuggingEnabled(true);
        
        // Load Local Assets (Offline/Dev Mode)
        webView.loadUrl("file:///android_asset/public/index.html");
    }

    @Override
    public void onInit(int status) {
        Log.d(TAG, "TTS onInit: " + status);
        if (status == TextToSpeech.SUCCESS) {
            int result = tts.setLanguage(Locale.JAPAN);
            Log.d(TAG, "TTS setLanguage result: " + result);
            
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) {
                    Log.d(TAG, "TTS onStart: " + utteranceId);
                }

                @Override public void onDone(String utteranceId) {
                    Log.d(TAG, "TTS onDone: " + utteranceId);
                    if (webView != null) {
                        webView.post(() -> {
                            try {
                                Log.d(TAG, "TTS calling androidAudioFinished via JS");
                                webView.evaluateJavascript("if(window.androidAudioFinished) window.androidAudioFinished(); else console.error('androidAudioFinished missing')", null);
                            } catch (Exception e) {
                                Log.e(TAG, "TTS JS Callback Failed", e);
                            }
                        });
                    } else {
                        Log.e(TAG, "TTS onDone: webView is null!");
                    }
                }

                @Override public void onError(String utteranceId) {
                    Log.e(TAG, "TTS onError: " + utteranceId);
                    if (webView != null) {
                        webView.post(() -> {
                             try {
                                webView.evaluateJavascript("if(window.androidAudioFinished) window.androidAudioFinished();", null);
                             } catch (Exception e) { e.printStackTrace(); }
                        });
                    }
                }
            });
        } else {
            Log.e(TAG, "TTS Init Failed!");
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (uploadMessage != null) {
                uploadMessage.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, intent));
                uploadMessage = null;
            }
        }
    }

    @Keep
    public class WebAppInterface {
        Context mContext;
        WebAppInterface(Context c) { mContext = c; }

        @Keep
        @JavascriptInterface
        public void speak(String text) {
            Log.d(TAG, "TTS speak requested: " + text);
            if (tts != null) {
                // Use Bundle for API 21+ compatibility
                Bundle params = new Bundle();
                params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, UTTERANCE_ID);
                int res = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, UTTERANCE_ID);
                Log.d(TAG, "TTS speak result: " + res);
            } else {
                 Log.e(TAG, "TTS mock speak: tts is null");
            }
        }

        @Keep
        @JavascriptInterface
        public void stop() {
            Log.d(TAG, "TTS stop requested");
            if (tts != null) tts.stop();
        }
    }
}
