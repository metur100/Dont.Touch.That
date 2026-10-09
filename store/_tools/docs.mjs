/**
 * Generates the store documents and plain-text listing files from content.mjs:
 *   store/play-store/PLAY-CONSOLE.md + listing/en-US/*.txt
 *   store/app-store/APP-STORE-CONNECT.md + metadata/en-US/*.txt
 * Usage: node store/_tools/docs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { APP, CONTACT, IOS, PLAY } from './content.mjs';

const STORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const len = (s) => [...s].length;
const block = (label, text, max) => `**${label}** (${len(text)}/${max})\n\`\`\`text\n${text}\n\`\`\`\n`;
const PRIVACY = `${CONTACT.site}/privacy.html`;
const PLACEHOLDERS = CONTACT.email.includes('YOUR-') || CONTACT.site.includes('YOUR-');

function check(name, text, max) {
  if (len(text) > max) throw new Error(`${name} is ${len(text)} chars (max ${max})`);
}
check('Play title', PLAY.title, 30);
check('Play short description', PLAY.short, 80);
check('Play full description', PLAY.full, 4000);
check('iOS name', IOS.name, 30);
check('iOS subtitle', IOS.subtitle, 30);
check('iOS promotional text', IOS.promo, 170);
check('iOS keywords', IOS.keywords, 100);
check('iOS description', IOS.description, 4000);

function write(rel, text) {
  const file = path.join(STORE, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith('\n') ? text : `${text}\n`);
}

const todo = PLACEHOLDERS
  ? `> **Before you start:** set your support email and website in \`store/_tools/content.mjs\` (\`CONTACT\`), publish \`store/site/\`
> (privacy policy + support page) and run \`node store/_tools/docs.mjs\` again. Both stores require a reachable privacy policy URL.\n\n`
  : '';

// ---------- Google Play ----------
write('play-store/listing/en-US/title.txt', PLAY.title);
write('play-store/listing/en-US/short_description.txt', PLAY.short);
write('play-store/listing/en-US/full_description.txt', PLAY.full);
write('play-store/listing/en-US/release_notes.txt', PLAY.releaseNotes);

write('play-store/PLAY-CONSOLE.md', `# ${APP.name} – Google Play Console

Everything needed to create and publish **${APP.name}** in the Play Console, in the order the Console asks for it.
Files referenced below are in this folder (\`store/play-store/\`).

${todo}| | |
| --- | --- |
| Package name | \`${APP.androidPackage}\` |
| Version | ${APP.version} (version code 1) |
| Upload file | \`android/app/build/outputs/bundle/release/app-release.aab\` (see *6. Build the release*) |
| Upload key | \`C:\\Users\\TurkesMedin\\keystore\\donttouchthat\`, alias \`donttouchthat.key\` (create it in step 6) |
| Privacy policy | ${PRIVACY} |
| Website | ${CONTACT.site} |
| Contact email | ${CONTACT.email} |
| Target audience | 13–15, 16–17, 18+ |

## 1. Create app

*Home → Create app*

- **App name:** \`${PLAY.title}\`
- **Default language:** English (United States) – en-US
- **App or game:** Game
- **Free or paid:** Free
- Accept the Developer Program Policies and US export laws declarations.

## 2. Store listing

*Grow users → Store presence → Main store listing*

${block('App name', PLAY.title, 30)}
${block('Short description', PLAY.short, 80)}
${block('Full description', PLAY.full, 4000)}
**Release notes (“What’s new”)**
\`\`\`text
<en-US>
${PLAY.releaseNotes}
</en-US>
\`\`\`

### Graphics

| Asset | File | Requirement |
| --- | --- | --- |
| App icon | \`graphics/icon-512.png\` | 512 × 512 PNG |
| Feature graphic | \`graphics/feature-graphic.png\` | 1024 × 500, no transparency |
| Phone screenshots | \`screenshots/phone/\` (8) | 1080 × 1920 |

Upload the screenshots in file-name order (01 … 08). Tablet screenshots are optional (the game is a phone-first portrait game); you can upload the phone screenshots there too if the Console asks.

## 3. Store settings

*Grow users → Store presence → Store settings*

- **App category:** Game → **Casual**
- **Tags** (up to 5): Casual, Puzzle, Arcade, Offline, Single player
- **Email address:** ${CONTACT.email}
- **Website:** ${CONTACT.site}
- **Phone number:** leave empty (optional)
- **External marketing:** allowed (default)

## 4. App content (Policy → App content)

### Privacy policy
${PRIVACY}

### App access
**All functionality in my app is available without any access restrictions.** (No login, no account.)

### Ads
**No, my app does not contain ads.**

### Content rating
Start the IARC questionnaire:
- **Email:** ${CONTACT.email}
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
3. *Create new release* → upload the \`.aab\` → release name \`${APP.version} (1)\` → paste the release notes above.
4. *Production → Countries/regions:* add all countries.
5. Submit for review.

## 6. Build the release (from this PC)

**Once – create the upload key** (choose a strong password and keep it in your password manager):

\`\`\`powershell
& "C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe" -genkeypair -v -storetype PKCS12 \`
  -keystore C:\\Users\\TurkesMedin\\keystore\\donttouchthat -alias donttouchthat.key \`
  -keyalg RSA -keysize 2048 -validity 18250 \`
  -dname "CN=${CONTACT.name}, L=Düsseldorf, ST=NRW, C=DE"
\`\`\`

Then add these lines to \`C:\\Users\\TurkesMedin\\.gradle\\gradle.properties\` (the passwords never go into the repository):

\`\`\`properties
DONT_TOUCH_THAT_UPLOAD_STORE_FILE=C:/Users/TurkesMedin/keystore/donttouchthat
DONT_TOUCH_THAT_UPLOAD_STORE_PASSWORD=your-password
DONT_TOUCH_THAT_UPLOAD_KEY_ALIAS=donttouchthat.key
DONT_TOUCH_THAT_UPLOAD_KEY_PASSWORD=your-password
\`\`\`

**Every release:**

\`\`\`powershell
cd C:\\Users\\TurkesMedin\\repos\\Medin\\Dont.Touch.That
npx expo prebuild --platform android --clean
cd android
.\\gradlew bundleRelease     # -> app\\build\\outputs\\bundle\\release\\app-release.aab
\`\`\`

Increase \`expo.android.versionCode\` (and \`expo.version\`) in \`app.json\` for every update.
**Back up the keystore file and its password** – with Play App Signing a lost upload key can be reset through Google support, but it takes time.
`);

// ---------- App Store ----------
write('app-store/metadata/en-US/name.txt', IOS.name);
write('app-store/metadata/en-US/subtitle.txt', IOS.subtitle);
write('app-store/metadata/en-US/promotional_text.txt', IOS.promo);
write('app-store/metadata/en-US/keywords.txt', IOS.keywords);
write('app-store/metadata/en-US/description.txt', IOS.description);
write('app-store/metadata/en-US/release_notes.txt', IOS.releaseNotes);

write('app-store/APP-STORE-CONNECT.md', `# ${APP.name} – App Store Connect

Everything needed to publish **${APP.name}** on the App Store, in the order App Store Connect asks for it.
Files referenced below are in this folder (\`store/app-store/\`).

${todo}| | |
| --- | --- |
| Bundle ID | \`${APP.iosBundleId}\` |
| SKU | \`${APP.sku}\` |
| Version | ${APP.version} (build number set automatically by EAS) |
| Primary language | English (U.S.) |
| Price | Free (all countries) |
| Contact / support email | ${CONTACT.email} |
| Privacy Policy URL | ${PRIVACY} |
| Support / Marketing URL | ${CONTACT.site} |

## 1. Build and upload (from this PC, no Mac needed)

\`\`\`powershell
cd C:\\Users\\TurkesMedin\\repos\\Medin\\Dont.Touch.That
npx eas-cli@latest login                     # once per PC
npx eas-cli@latest init                      # once: links the project to your Expo account (adds extra.eas.projectId to app.json)
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios --profile production --latest
\`\`\`

Answers the first build asks: log in to Apple → **Yes**; choose your team; generate Distribution Certificate → **Yes**; generate Provisioning Profile → **Yes**; Push Notifications → **No** (the game has no notifications).
The first \`submit\` creates the app record in App Store Connect if it does not exist yet (or create it first: *Apps → + → New App*, platform iOS, name \`${IOS.name}\`, bundle ID \`${APP.iosBundleId}\`, SKU \`${APP.sku}\`, full access).
After Apple has processed the build (5–30 minutes) it appears under **TestFlight**.

## 2. App Information (General → App Information)

${block('Name', IOS.name, 30)}
${block('Subtitle', IOS.subtitle, 30)}
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

- **Privacy Policy URL:** ${PRIVACY}
- **Data Collection → Get Started:** **“No, we do not collect data from this app.”** → Publish.
  The App Store then shows **“Data Not Collected”**.

## 5. Version ${APP.version} (iOS App → ${APP.version} Prepare for Submission)

### Screenshots

| Device size | Folder | Size | Count |
| --- | --- | --- | --- |
| iPhone 6.9" Display (required) | \`screenshots/iphone-6.9/\` | 1320 × 2868 | 8 |
| iPhone 6.5" Display (only if asked) | \`screenshots/iphone-6.5/\` | 1284 × 2778 | 8 |
| iPhone 6.3" Display (optional) | \`screenshots/iphone-6.3/\` | 1206 × 2622 | 8 |

Drag the files in name order (01 … 08). iPad screenshots are **not** needed (the game is iPhone-only: \`supportsTablet: false\`).

### Texts

${block('Promotional text', IOS.promo, 170)}
${block('Keywords (comma-separated, no spaces)', IOS.keywords, 100)}
${block('Description', IOS.description, 4000)}
- **Support URL:** ${CONTACT.site} · **Marketing URL:** ${CONTACT.site}
- **Version:** ${APP.version}
- **Copyright:** \`${APP.copyright}\`
- **Build:** choose the build uploaded with \`eas submit\` (+ Add Build). Export compliance is answered automatically (\`ITSAppUsesNonExemptEncryption = NO\`).
- **App Review Information:**
  - Sign-in required: **No**
  - Contact: ${CONTACT.name}, ${CONTACT.email}, phone: **your phone number** (required by Apple, not shown publicly)
  - Notes:
\`\`\`text
${IOS.reviewNotes}
\`\`\`
- **Version Release:** “Manually release this version” (recommended for the first release).

Then **Add for Review → Submit to App Review**.

### What’s New (for later updates)
\`\`\`text
${IOS.releaseNotes}
\`\`\`
`);

// ---------- Website (privacy policy + support page): keep the contact email in sync ----------
for (const page of ['site/index.html', 'site/privacy.html']) {
  const file = path.join(STORE, page);
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, html.replace(/(mailto:)[^"]+("[^>]*>)[^<]+(<\/a>)/g, `$1${CONTACT.email}$2${CONTACT.email}$3`));
}

console.log(`docs written${PLACEHOLDERS ? ' (contact placeholders still set in content.mjs)' : ''}`);
