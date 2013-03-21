#!/bin/bash

cd /Users/Jed/Documents/gesturePad

find . -name .DS_Store -ls -exec rm {} \;

rm -r /Users/Jed/Documents/gesturePad/cydia/var/mobile/Applications/gesturePad/gesturePad.app

cp -r /Users/Jed/Documents/gesturePad/build/gesturePad/Build/Products/Debug-iphoneos/gesturePad.app /Users/Jed/Documents/gesturePad/cydia/gesturePad/var/mobile/Applications/gesturePad/gesturePad.app

cd /Users/Jed/Documents/gesturePad/cydia/

dpkg-deb -b gesturePad /Users/Jed/Documents/gesturePad/deb/gesturePad.deb