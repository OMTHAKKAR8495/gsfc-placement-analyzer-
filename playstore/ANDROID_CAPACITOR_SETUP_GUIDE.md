# 📱 GSFC University Placement Portal — Capacitor Android App Guide
> **Complete Setup, Native Plugins, Keystore Signing, and Play Store (.aab) Submission Guide**

---

## 🛠️ 1. Project Configuration Summary

* **App Name**: `GSFC Placement Portal`
* **App ID**: `edu.gsfcuniversity.placementportal`
* **Web Build Directory**: `frontend/dist`
* **Native Platform Scaffold**: `frontend/android`

### Installed Capacitor Native Plugins:
1. `@capacitor/app`: Native Android hardware Back Button listener and app lifecycle handler.
2. `@capacitor/status-bar`: Navy `#1E3A8A` status bar theme color matching GSFC navbar.
3. `@capacitor/splash-screen`: Navy `#0F172A` background splash screen.
4. `@capacitor/network`: Real-time offline detection banner (`WifiOff` toast).
5. `@capacitor/filesystem`: File upload bridge for resumes & company question documents.
6. `@capacitor/push-notifications`: Target company drive alerts and placement reminders.

---

## 🚀 2. Building Native Android Bundle

Run the combined build script from the project root:
```bash
npm --prefix frontend run build:android
```
This automatically compiles Vite web assets and syncs them into `frontend/android/app/src/main/assets/public`.

---

## 🔐 3. Generating Release Keystore for Play Store Signing

> ⚠️ **CRITICAL SECURITY NOTE**: Never commit `gsfc-release-key.keystore` or its password to Git. Keep a secure offline backup. Losing this keystore prevents future app updates on the Play Store.

Run this keytool command in your terminal to generate your release keystore:
```bash
keytool -genkey -v -keystore playstore/gsfc-release-key.keystore \
  -alias gsfc-portal \
  -keyalg RSA -keysize 2048 -validity 10000
```

---

## 📦 4. Building Final Release `.aab` (Android App Bundle)

To generate the final `.aab` file required by Google Play Console:

```bash
cd frontend/android
./gradlew bundleRelease
```

The signed `.aab` bundle will be generated at:
`frontend/android/app/build/outputs/bundle/release/app-release.aab`

---

## 📡 5. Backend Server API Configuration for Android APK

When running inside an Android APK:
* If testing on **Android Emulator**, backend localhost maps to `http://10.0.2.2:5000`.
* For **Production Play Store Release**, ensure your backend node server is deployed to an HTTPS domain (e.g. `https://api.gsfc-placement.university.edu`).
