#!/usr/bin/env bash
# shoot.sh <file> <deep-link-path> <seconds> [tap-x tap-y tap-at-seconds]
# Cold-starts the app on donttouchthat://<path> on the running emulator (1080x1920, demo status bar), optionally taps,
# and saves a screenshot to store/raw/$RAWSET/<file>.png (RAWSET = phone | tall) after <seconds>.
set -e
export MSYS_NO_PATHCONV=1
ADB=${ADB:-adb}
OUT="$(cd "$(dirname "$0")/.." && pwd)/raw/${RAWSET:-phone}/$1.png"; mkdir -p "$(dirname "$OUT")"
$ADB shell am force-stop com.medinturkes.donttouchthat; if $ADB shell am start -a android.intent.action.VIEW -d "'donttouchthat://$2'" com.medinturkes.donttouchthat 2>&1 | grep -q "Error"; then echo "launch failed: is the release build installed?" >&2; exit 1; fi
if [ -n "$4" ]; then
  sleep "$6"; $ADB shell input tap "$4" "$5"
  sleep "$(awk "BEGIN{print $3-$6}")"
else
  sleep "$3"
fi
$ADB exec-out screencap -p > "$OUT"
echo "saved $OUT"
