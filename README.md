# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Git Push Instructions (কিভাবে গিট পুশ করবেন)

1. **Add changes (ফাইল অ্যাড করুন):**
   ```bash
   git add .
   ```

2. **Commit changes (কমিট করুন):**
   ```bash
   git commit -m "Describe your changes here"
   ```

3. **Push to server (সার্ভারে পাঠান):**
   ```bash
   git push
   ```

apk build note:

Power shell
cd "E:\JFT\Irodori apps - Copy\android_app"
.\gradlew clean
.\gradlew assembleRelease


adb logcat note:
// clear logcat
// filter logcat by tag name
adb logcat -c
adb logcat -s IRODORI_WEBVIEW IRODORI_TTS



adb uninstall com.irodori.ai
adb install "E:\JFT\Irodori apps - Copy - Copy\android_app\app\build\outputs\apk\debug\IrodoriAI.apk"






``````````````````
✅ IDEAL DEPLOYMENT ORDER (RECOMMENDED)
🔁 Big Picture Order

Code → Git → Build → Web Deploy → Android Build → APK/AAB Deploy

1️⃣ Code final
2️⃣ Git commit & push
3️⃣ Web build
4️⃣ Firebase deploy (web)
5️⃣ Android build
6️⃣ Signed APK / AAB deploy

1= 

✅ OPTION 1 (Recommended): PowerShell command
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force .firebase

✅ OPTION 2: CMD compatible (classic Windows)
rmdir /s /q dist
rmdir /s /q .firebasegit add .


2= 
npm run build

3=
git status
git add .
git commit -m "Fix tag add sync + Firestore stable"
git push

4= 
firebase deploy
firebase deploy --only hosting

🟢 এখন Web DONE

এখন Android এ যাও

5= npm run build

clean buid deploy firebase a deploy git deploy apk deploy koro


