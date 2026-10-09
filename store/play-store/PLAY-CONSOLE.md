# Don't Touch That! – Google Play Console

Everything needed to create and publish **Don't Touch That!** in the Play Console, in the order the Console asks for it.
Files referenced below are in this folder (`store/play-store/`).

> **Before you start:** set your support email and website in `store/_tools/content.mjs` (`CONTACT`), publish `store/site/`
> (privacy policy + support page) and run `node store/_tools/docs.mjs` again. Both stores require a reachable privacy policy URL.

| | |
| --- | --- |
| Package name | `com.medinturkes.donttouchthat` |
| Version | 1.0.0 (version code 1) |
| Upload file | `android/app/build/outputs/bundle/release/app-release.aab` (see *6. Build the release*) |
| Upload key | `C:\Users\TurkesMedin\keystore\donttouchthat`, alias `donttouchthat.key` (create it in step 6) |
| Privacy policy | https://YOUR-GITHUB-USER.github.io/dont-touch-that/privacy.html |
| Website | https://YOUR-GITHUB-USER.github.io/dont-touch-that |
| Contact email | YOUR-SUPPORT-EMAIL@example.com |
| Target audience | 13–15, 16–17, 18+ |

## 1. Create app

*Home → Create app*

- **App name:** `Don't Touch That!`
- **Default language:** English (United States) – en-US
- **App or game:** Game
- **Free or paid:** Free
- Accept the Developer Program Policies and US export laws declarations.

## 2. Store listing

*Grow users → Store presence → Main store listing*

**App name** (17/30)
```text
Don't Touch That!
```

**Short description** (71/80)
```text
100 levels of buttons you must NOT press. Can you resist? Probably not.
```

**Full description** (1872/4000)
```text
Don't touch the button.
...You're going to touch the button, aren't you?

DON'T TOUCH THAT! is a funny reaction and puzzle game about the one thing humans are worst at: NOT doing the thing they were just told not to do.

Every level gives you one simple instruction. Don't tap. Don't swipe left. Don't hold the button. Don't touch the red one. Easy, right? Then the game starts cheating. Buttons pulse, beg and run away. A chicken chases your finger. Fake "LEVEL COMPLETE" screens appear. Instructions change while you read them. Controls reverse. And sometimes you actually have to touch something – fast.

100 HAND-MADE LEVELS
• Big tempting buttons, moving buttons, buttons that run away
• Don't touch the chicken (it knows)
• Memory, reaction, timing and swipe challenges
• Fake buttons, fake ads, fake success screens – trust nothing
• Reversed controls and instructions that lie
• 10 chapters, ending in multi-stage boss levels

3 GAME MODES
• Classic – 100 levels, 3 lives, chapter by chapter
• Endless – random challenges that keep getting harder, with special rounds every 10 levels and boss rounds every 25
• Daily Challenge – the same 10 levels for everyone each day, one official attempt (practice as often as you like)

RESIST AND SCORE
• Streaks, fast-reaction bonuses and streak milestones
• 13 achievements, including "Curiosity Killed the Button"
• Detailed stats – how many things have you touched?
• Unlockable themes: Neon, Space, Underwater, Halloween and Christmas

MADE FOR ONE THUMB
• Levels take 3–15 seconds – perfect for quick breaks
• Satisfying animations, sounds and haptic feedback
• Light and dark mode, colour-name labels for colour-blind players, reduced screen shake

FAIR AND PRIVATE
• Free – no ads, no in-app purchases
• No account, no tracking, no data collection
• Fully offline – play anywhere

Whatever you do... DON'T TOUCH THAT.
```

**Release notes (“What’s new”)**
```text
<en-US>
First release. Try not to touch anything.
</en-US>
```

### Graphics

| Asset | File | Requirement |
| --- | --- | --- |
| App icon | `graphics/icon-512.png` | 512 × 512 PNG |
| Feature graphic | `graphics/feature-graphic.png` | 1024 × 500, no transparency |
| Phone screenshots | `screenshots/phone/` (8) | 1080 × 1920 |

Upload the screenshots in file-name order (01 … 08). Tablet screenshots are optional (the game is a phone-first portrait game); you can upload the phone screenshots there too if the Console asks.

## 3. Store settings

*Grow users → Store presence → Store settings*

- **App category:** Game → **Casual**
- **Tags** (up to 5): Casual, Puzzle, Arcade, Offline, Single player
- **Email address:** YOUR-SUPPORT-EMAIL@example.com
- **Website:** https://YOUR-GITHUB-USER.github.io/dont-touch-that
- **Phone number:** leave empty (optional)
- **External marketing:** allowed (default)

## 4. App content (Policy → App content)

### Privacy policy
https://YOUR-GITHUB-USER.github.io/dont-touch-that/privacy.html

### App access
**All functionality in my app is available without any access restrictions.** (No login, no account.)

### Ads
**No, my app does not contain ads.**

### Content rating
Start the IARC questionnaire:
- **Email:** YOUR-SUPPORT-EMAIL@example.com
- **Category:** **Game**
- Violence: **No.** (Cartoon emoji such as 💣 or 💥 appear as a joke when you fail; nobody and nothing is hurt.)
- Fear/horror, sexuality, nudity, language/profanity, crude humour, drugs/alcohol/tobacco, discrimination: **No** to every question.
- Gambling or simulated gambling: **No**
- Users can interact or exchange content (chat, sharing): **No**
- Shares the user’s current physical location: **No**
- Allows purchases of digital goods: **No**
- Unrestricted internet / web browser: **No**
- Expected result: **PEGI 3 · USK 0 · ESRB Everyone · IARC 3+**

### Target audience and content
- **Target age groups:** 13–15, 16–17, 18+
- **Could the app unintentionally appeal to children?** Answer **Yes** – it is a bright, casual game. That is fine: it has no ads, no purchases and collects no data, so it already meets the Families requirements.
  *Option:* if you *want* to target under-13s too, tick 5–8/9–12 as well; then the app falls under the Families Policy (no extra work needed for this app, but Google reviews it more strictly and it can take longer).

### News app
**No.**

### COVID-19 contact tracing and status apps
**My app is not a publicly available COVID-19 contact tracing or status app.**

### Data safety
- **Does your app collect or share any of the required user data types?** **No.**
  (Scores, stats, achievements and settings are stored only on the device and never transmitted. The accelerometer is read on the device only, for one level type; nothing is stored or sent.)
- Everything else in the form is then skipped. Summary on Google Play: *“No data collected · No data shared with third parties”*.

### Government apps
**No.**

### Financial features
**My app doesn’t provide any financial features.**

### Health
**My app does not have any health features.**

### Advertising ID
**No**, the app does not use an advertising ID.

### Permissions
No special declarations are needed. The app only uses normal permissions granted at install time (vibration for haptics, internet/network state added by the React Native runtime; the game itself never goes online).

## 5. Release

1. *Setup → App signing:* keep **Google Play App Signing** (recommended). You upload the AAB signed with your upload key; Google manages the app signing key.
2. Personal developer accounts created after November 2023 must first run a **closed test** (currently at least 12 testers for 14 days) before publishing to production – the Console shows the exact requirement for your account. Start with **Testing → Internal testing** (add yourself), then **Closed testing**.
3. *Create new release* → upload the `.aab` → release name `1.0.0 (1)` → paste the release notes above.
4. *Production → Countries/regions:* add all countries.
5. Submit for review.

## 6. Build the release (from this PC)

**Once – create the upload key** (choose a strong password and keep it in your password manager):

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v -storetype PKCS12 `
  -keystore C:\Users\TurkesMedin\keystore\donttouchthat -alias donttouchthat.key `
  -keyalg RSA -keysize 2048 -validity 18250 `
  -dname "CN=Medin Turkes, L=Düsseldorf, ST=NRW, C=DE"
```

Then add these lines to `C:\Users\TurkesMedin\.gradle\gradle.properties` (the passwords never go into the repository):

```properties
DONT_TOUCH_THAT_UPLOAD_STORE_FILE=C:/Users/TurkesMedin/keystore/donttouchthat
DONT_TOUCH_THAT_UPLOAD_STORE_PASSWORD=your-password
DONT_TOUCH_THAT_UPLOAD_KEY_ALIAS=donttouchthat.key
DONT_TOUCH_THAT_UPLOAD_KEY_PASSWORD=your-password
```

**Every release:**

```powershell
cd C:\Users\TurkesMedin\repos\Medin\Dont.Touch.That
npx expo prebuild --platform android --clean
cd android
.\gradlew bundleRelease     # -> app\build\outputs\bundle\release\app-release.aab
```

Increase `expo.android.versionCode` (and `expo.version`) in `app.json` for every update.
**Back up the keystore file and its password** – with Play App Signing a lost upload key can be reset through Google support, but it takes time.
