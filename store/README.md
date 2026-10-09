# Store material – Don't Touch That!

| Store | Start here | Contents |
| --- | --- | --- |
| Google Play | [`play-store/PLAY-CONSOLE.md`](play-store/PLAY-CONSOLE.md) | every Console answer · `listing/en-US/*.txt` · `graphics/` (icon 512, feature graphic) · `screenshots/phone/` (8 × 1080×1920) |
| App Store | [`app-store/APP-STORE-CONNECT.md`](app-store/APP-STORE-CONNECT.md) | every App Store Connect answer · `metadata/en-US/*.txt` · `screenshots/iphone-6.9 / 6.5 / 6.3/` (8 each) · `header/` (product page header art) |
| Website | [Dont.Touch.That.Landing](https://github.com/metur100/Dont.Touch.That.Landing) (separate repo) | landing page, support, privacy policy, terms – live at https://metur100.github.io/Dont.Touch.That.Landing/ |

**First:** fill in `CONTACT` (support email + website) in `_tools/content.mjs`, then run `node store/_tools/docs.mjs` –
it regenerates both guides and the listing text files.

## Regenerating the images

```bash
# release build installed on a running emulator
ADB=~/AppData/Local/Android/Sdk/platform-tools/adb.exe bash store/_tools/capture-all.sh   # → raw/phone, raw/tall
node store/_tools/render.mjs                                                            # → all store images
```

Captions live in `_tools/content.mjs` (`CAPTIONS`). Requires ffmpeg and Microsoft Edge (headless renderer).
