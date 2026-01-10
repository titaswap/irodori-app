# Single Source of Truth Workflow

This project acts as a Single Source of Truth for both the Web Application and the Android WebView App.

## 1. Development Principles
- **Web First**: All features, UI changes, and logic updates are made in the web project (src/).
- **No Logic Duplication**: The Android app is a thin wrapper. Do not add meaningful logic to `MainActivity.java` unless it's strictly platform-specific (e.g., handling hardware back button or file intents).

## 2. Platform Compatibility
The web app is configured (`vite.config.js`) with `base: './'` to support:
- **Web**: Hosting on any domain or subdirectory.
- **Mobile**: Loading via `file:///` protocol in Android WebView.

## 3. How to Update
When you have made changes to the web code:

### Step 1: Run Automation Script
Run the following command in the project root:
```bash
node scripts/build-mobile.js
```
This script will:
1.  Run `npm run build` (Production build).
2.  Clean the `android_app/app/src/main/assets` folder.
3.  Copy the fresh `dist/` contents to `android_app/app/src/main/assets`.

### Step 2: Build Android App
1.  Open **Android Studio**.
2.  Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  The resulting APK will contain the latest web version.

## 4. WebView Configuration API
The Android app is pre-configured to support this workflow:
- **Entry Point**: `file:///android_asset/index.html`
- **Features Enabled**:
    - JavaScript
    - DOM Storage (localStorage/sessionStorage)
    - Cookies (Third-party enabled)
    - File Access (Universal & File URLs)
    - HTTPS mixed content compatibility

## 5. Troubleshooting
If you encounter a white screen or load failure in the WebView:
1.  **Check Asset Paths**: Ensure `vite.config.js` has `base: './'`. Absolute paths (starting with `/`) will fail in WebView.
2.  **Verify Index Location**: `index.html` must be directly inside `android_app/app/src/main/assets/`.
3.  **Inspect Logs**: Use `chrome://inspect` to view the WebView console errors.
4.  **Do NOT Edit Android Code**: Verify the web build works locally first. Only touch Java code if the issue is strictly native (e.g., permissions).

## 6. Auto-Update System
The app includes an auto-update check that runs on startup.

### How it works
1.  **Local Version**: Defined in `package.json` -> `version`. This is bundled into the APK.
2.  **Remote Version**: The app fetches `app-version.json` from the configured remote URL.
3.  **Detection**: If `remoteVersion !== localVersion`, an update prompt is shown.

### Configuration
- **Remote URL**: Set `VITE_REMOTE_VERSION_URL` in your `.env` file (e.g., `VITE_REMOTE_VERSION_URL=https://your-firebase-app.web.app`).
- **Version File**: Upload `public/app-version.json` to your hosting root.
  ```json
  {
    "version": "1.1.0",
    "force": false,
    "storeUrl": "https://play.google.com/store/apps/details?id=...",
    "message": "New features available!"
  }
  ```

### Releasing an Update

#### 1. Optional Web Content Update
Users can choose to update or dismiss the prompt.
1.  **Web Project**: Increment version in `package.json` (e.g., `1.0.1` -> `1.0.2`).
2.  **Deploy**: Run `npm run build` & deploy to Firebase Hosting.
3.  **Trigger**: Update `public/app-version.json` on Firebase Hosting:
    ```json
    {
      "version": "1.0.2",
      "force": false,
      "message": "We've added new vocabulary lists!"
    }
    ```

#### 2. Forced Critical Update
Users are BLOCKED until they update.
1.  **Trigger**: Update `public/app-version.json` on Firebase Hosting:
    ```json
    {
      "version": "1.0.3",
      "force": true,
      "message": "Critical security fix. Please update immediately."
    }
    ```

#### 3. Native App Update (Play Store)
For native updates (APK changes) that cannot be handled via web reload:
1.  **Trigger**: Update `public/app-version.json` with a message instructing the user:
    ```json
    {
      "version": "2.0.0",
      "force": true,
      "message": "Major update! Please download the new version from the Play Store."
    }
    ```
2.  **Action**: The "Update Now" button will reload the app. If the user needs to go to the store, consider adding the link in the message text or ensuring the app handles deep links. *Current implementation strictly reloads to avoid WebView link errors.*

### Rollbacks
If a bad update is deployed, you can "rollback" by simply deploying a **newer** version number with the **old** stable code.
- **Do not** lower the version number in `app-version.json` (e.g. going from 1.0.2 back to 1.0.1) because the comparison logic `remote > local` will treat it as "no update available".
- **Instead**: Bump version to `1.0.3`, revert code to state of `1.0.1`, and deploy.

### Zero-Rebuild Guarantee
- **Content Updates**: Changing `app-version.json` + Web Deploy = Instant update for all users.
- **APK Rebuild**: Only needed if you change `AndroidManifest.xml`, native Java code, or app icon.



