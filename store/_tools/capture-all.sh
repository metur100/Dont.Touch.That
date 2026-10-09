#!/usr/bin/env bash
# capture-all.sh – captures the 8 store scenes twice on the running emulator (release build installed):
#   raw/phone/  1080×1920 (Google Play, 16:9)      raw/tall/  1080×2346 (App Store, iPhone 19.5:9)
# Demo status bar (9:41, full battery), density 400. Restores the emulator size afterwards.
set -e
export MSYS_NO_PATHCONV=1
ADB=${ADB:-adb}; export ADB
DIR=$(cd "$(dirname "$0")" && pwd)
demo() { $ADB shell am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }
$ADB shell settings put global sysui_demo_allowed 1
demo exit; demo enter
demo clock -e hhmm 0941
demo battery -e level 100 -e plugged false
demo network -e wifi show -e level 4 -e fully true -e mobile hide
demo notifications -e visible false
$ADB shell wm density 400
for set in phone tall; do
  export RAWSET=$set
  if [ $set = phone ]; then $ADB shell wm size 1080x1920; TAPY=1190; else $ADB shell wm size 1080x2346; TAPY=1400; fi
  sleep 3
  s() { bash "$DIR/shoot.sh" "$@" >/dev/null; echo "  $set/$1"; }
  s 01-menu '' 3.8
  s 02-button 'play?mode=classic&start=8' 3.4
  s 03-fail 'play?mode=classic&start=0' 3.25 540 $TAPY 2.5
  s 04-chicken 'play?mode=classic&start=12' 3.6
  s 05-bombs 'play?mode=classic&start=14' 3.6
  s 06-fake 'play?mode=classic&start=33' 3.6
  s 07-memory 'play?mode=classic&start=31' 3.0
  s 08-daily 'daily' 2.8
done
$ADB shell wm size reset; $ADB shell wm density reset; demo exit
