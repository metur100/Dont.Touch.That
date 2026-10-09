# Don't Touch That! – App Store Connect

Everything needed to publish **Don't Touch That!** on the App Store, in the order App Store Connect asks for it.
Files referenced below are in this folder (`store/app-store/`).

| | |
| --- | --- |
| Bundle ID | `com.certidevelopment.donttouchthat` |
| SKU | `DONTTOUCHTHAT001` |
| Version | 1.0.0 (build number set automatically by EAS) |
| Primary language | English (U.S.) |
| Price | Free (all countries) |
| Contact / support email | certidevelopment@gmail.com |
| Privacy Policy URL | https://metur100.github.io/Dont.Touch.That.Landing/privacy.html |
| Support / Marketing URL | https://metur100.github.io/Dont.Touch.That.Landing |

## 1. Build and upload (from this PC, no Mac needed)

```powershell
cd C:\Users\TurkesMedin\repos\Medin\Dont.Touch.That
npx eas-cli@latest login                     # once per PC
npx eas-cli@latest init                      # once: links the project to your Expo account (adds extra.eas.projectId to app.json)
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios --profile production --latest
```

Answers the first build asks: log in to Apple → **Yes**; choose your team; generate Distribution Certificate → **Yes**; generate Provisioning Profile → **Yes**; Push Notifications → **No** (the game has no notifications).
The first `submit` creates the app record in App Store Connect if it does not exist yet (or create it first: *Apps → + → New App*, platform iOS, name `Don't Touch That!`, bundle ID `com.certidevelopment.donttouchthat`, SKU `DONTTOUCHTHAT001`, full access).
After Apple has processed the build (5–30 minutes) it appears under **TestFlight**.

## 2. App Information (General → App Information)

**Name** (17/30)
```text
Don't Touch That!
```

**Subtitle** (25/30)
```text
Resist the big red button
```

- **Category:** primary **Games**, secondary **Entertainment**; game subcategories **Casual** and **Puzzle**
- **Content Rights:** **No, it does not contain, show, or access third-party content.**
- **Age Rating** → Edit: answer **None / No** to every question:
  - Parental controls, age assurance, unrestricted web access, user-generated content, messaging/chat, advertising: **No**
  - Profanity, horror/fear, alcohol/tobacco/drugs, medical information, sexual content or nudity: **None**
  - Cartoon/fantasy violence, realistic violence, graphic violence, weapons: **None** (a 💣 emoji in a "don't pop the bombs" level is a joke object; nothing is hurt)
  - Simulated gambling, contests, loot boxes: **None**
  - Expected rating: **4+**
- **Made for Kids:** **No** (casual game for everyone; choosing "Made for Kids" adds extra review rules and is not needed).
- **License Agreement:** Apple's standard EULA.

## 3. Pricing and Availability

- **Price:** Free (USD 0.00) · **Availability:** all countries and regions · **Pre-order:** no

## 4. App Privacy

- **Privacy Policy URL:** https://metur100.github.io/Dont.Touch.That.Landing/privacy.html
- **Data Collection → Get Started:** **“No, we do not collect data from this app.”** → Publish.
  The App Store then shows **“Data Not Collected”**.

## 5. Version 1.0.0 (iOS App → 1.0.0 Prepare for Submission)

### Screenshots

| Device size | Folder | Size | Count |
| --- | --- | --- | --- |
| iPhone 6.9" Display (required) | `screenshots/iphone-6.9/` | 1320 × 2868 | 8 |
| iPhone 6.5" Display (only if asked) | `screenshots/iphone-6.5/` | 1284 × 2778 | 8 |
| iPhone 6.3" Display (optional) | `screenshots/iphone-6.3/` | 1206 × 2622 | 8 |

Drag the files in name order (01 … 08). iPad screenshots are **not** needed (the game is iPhone-only: `supportsTablet: false`).
App Store Connect only asks for iPad screenshots once a build that supports iPad is attached. If the iPad section is shown before
the build is uploaded, attach the build first; the iPad requirement disappears.

### Header artwork (optional, "Kopfzeilen-Inhalt")

Shown as the large banner at the top of the product page and in search results. Optional, but recommended.
Rendered by `node store/_tools/render.mjs --header` (no alpha channel, content kept in the centre so every crop works):

| Asset | File | Size |
| --- | --- | --- |
| Universal (header **and** search results) – use this one | `header/header-16x9.png` | 5244 × 2950 |
| Product page header only | `header/header-21x9.png` | 3840 × 1646 |

Upload `header-16x9.png`, check both crops in the preview (header 21:9, search 3:2) and enable it for search results too.

### Texts

**Promotional text** (148/170)
```text
100 levels that tell you what NOT to touch – then do everything to make you touch it. Classic, Endless and a Daily Challenge. Free, no ads, offline.
```

**Keywords (comma-separated, no spaces)** (93/100)
```text
button,reaction,funny,puzzle,brain,tap,resist,trick,prank,casual,daily,challenge,reflex,troll
```

**Description** (1872/4000)
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

- **Support URL:** https://metur100.github.io/Dont.Touch.That.Landing · **Marketing URL:** https://metur100.github.io/Dont.Touch.That.Landing
- **Version:** 1.0.0
- **Copyright:** `2026 Medin Turkes`
- **Build:** choose the build uploaded with `eas submit` (+ Add Build). Export compliance is answered automatically (`ITSAppUsesNonExemptEncryption = NO`).
- **App Review Information:**
  - Sign-in required: **No**
  - Contact: Medin Turkes, certidevelopment@gmail.com, phone: **your phone number** (required by Apple, not shown publicly)
  - Notes:
```text
No account or login is needed; everything works offline. The app has no ads, no in-app purchases, no analytics and no tracking.

How to play: each level tells you what NOT to do. Breaking the rule costs one of three lives – that is the joke of the game, not a bug. Some levels require an action (e.g. "Pop all the others!"); the hint under the instruction says so.

One optional level type ("Don't shake the soda") reads the accelerometer on the device only to detect shaking; no motion data is stored or sent.
```
- **Version Release:** “Manually release this version” (recommended for the first release).

Then **Add for Review → Submit to App Review**.

### What’s New (for later updates)
```text
First release. Try not to touch anything.
```
