# ProFormaX (Frontend)

Cross-platform mobile app for ProFormaX, built with **Expo** (SDK 54), **React Native**, and **NativeWind** (Tailwind CSS). It connects to the ProFormaX backend API and uses Google Gemini for AI features.

## Prerequisites

Install these before setting up the project:

| Requirement | Notes |
|-------------|--------|
| **Node.js** | v18 or v20 LTS recommended ([nodejs.org](https://nodejs.org/)) |
| **npm** | Ships with Node.js; this repo uses `package-lock.json` |
| **Git** | To clone the repository |
| **Expo Go** (optional) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779) for quick testing on a physical device |

### Platform-specific (native builds / emulators)

- **Android:** [Android Studio](https://developer.android.com/studio) with Android SDK and an emulator or USB debugging on a device
- **iOS (macOS only):** [Xcode](https://developer.apple.com/xcode/) and iOS Simulator, or a physical iPhone
- **EAS Build (optional):** [Expo Application Services](https://docs.expo.dev/build/introduction/) — install the CLI globally:

  ```bash
  npm install -g eas-cli
  ```

  Log in with your Expo account: `eas login`

## Installation

1. **Clone the repository** (or open the `frontend` folder if you already have the monorepo):

   ```bash
   git clone https://github.com/siejie17/proformax.git
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables** (see [Environment variables](#environment-variables)).

4. **Start the development server:**

   ```bash
   npm start
   ```

   Then press `a` (Android), `i` (iOS), or `w` (web) in the terminal, or scan the QR code with Expo Go.

## Environment variables

Env files are **gitignored**. Create them locally in the project root.

Expo only exposes variables prefixed with `EXPO_PUBLIC_` to the app. The project uses two files:

| File | When it is used |
|------|------------------|
| `.env.development` | Local development (`npm start`) |
| `.env.production` | Production builds (`eas build`, release) |

### Required variables

Create `.env.development` (and `.env.production` for releases) with:

```env
# Backend API base URL (must include /api if your server uses that path)
EXPO_PUBLIC_API_URL=https://your-api-host.com/api

# Google Gemini API key (for chatbot / AI features)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Base URL for REST calls via `services/api.js` (Axios) |
| `EXPO_PUBLIC_GEMINI_API_KEY` | API key for `@google/genai` in `services/geminiApi.js` |

### Local backend

If you run the API on your machine instead of production, point `EXPO_PUBLIC_API_URL` at your LAN IP (not `localhost` on a physical device). Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.92:8000/api
```

Restart the Expo dev server after changing env files.

### Obtaining API keys

- **Gemini:** Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
- **Backend:** Use the URL provided by your ProFormaX backend deployment; the app expects authenticated endpoints under that base URL.

Never commit real keys. `.env*` is listed in `.gitignore`.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server (Metro) |
| `npm run android` | Start and open on Android emulator/device |
| `npm run ios` | Start and open on iOS simulator/device (macOS) |
| `npm run web` | Run in the browser via React Native Web |

## Building for production (EAS)

The project includes `eas.json` with profiles: `development`, `preview`, and `production`.

1. Ensure `.env.production` is set with production values.
2. Install and log in to EAS CLI (see [Prerequisites](#prerequisites)).
3. Build:

   ```bash
   eas build --platform android
   eas build --platform ios
   ```

   Use `--profile development` or `--profile preview` for internal/testing builds.

Android package: `com.unimas.ProFormaX` (see `app.json`).

## Project structure

```
frontend/
├── App.js                 # Root app + auth routing
├── index.js               # Expo entry
├── app.json               # Expo config (name, icons, Android/iOS)
├── eas.json               # EAS Build profiles
├── babel.config.js        # Babel (Expo, NativeWind, Reanimated worklets)
├── metro.config.js        # Metro + NativeWind
├── tailwind.config.js     # Tailwind / NativeWind content paths
├── global.css             # Tailwind directives (imported in App.js)
├── assets/                # Images, logos, favicon
├── components/            # Reusable UI
├── contexts/              # React context (e.g. auth)
├── core/                  # Theme and shared constants
├── screens/               # Screen components
├── services/              # API client (api.js), Gemini (geminiApi.js)
└── stacks/                # React Navigation stacks
```

## Tech stack

- **Expo** ~54, **React** 19, **React Native** 0.81
- **React Navigation** (native stack, bottom tabs, material top tabs)
- **NativeWind** v4 + **Tailwind CSS** v3
- **React Native Paper**, **Gesture Handler**, **Reanimated**, **Bottom Sheet**
- **Axios** + **Async Storage** (API + auth token)
- **Google GenAI** (`@google/genai`) for Gemini 2.5 Flash

## Troubleshooting

- **Env vars not applied:** Stop Metro (`Ctrl+C`) and run `npm start` again. Clear cache if needed: `npx expo start -c`.
- **Cannot reach API on device:** Use your computer’s LAN IP in `EXPO_PUBLIC_API_URL`, not `127.0.0.1`.
- **Android/iOS native folders:** This repo does not commit `/android` or `/ios`; use `npx expo prebuild` if you need bare workflow, or rely on EAS Build / Expo Go.
- **New Architecture:** Enabled in `app.json` (`newArchEnabled: true`); use a recent Expo Go or a dev client build that supports it.

## Related documentation

- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)
- [Expo SDK 54](https://docs.expo.dev/)
- [NativeWind v4 setup](https://www.nativewind.dev/v4/getting-started/expo-router)
- [EAS Build](https://docs.expo.dev/build/introduction/)
