#!/bin/bash

cd /Users/Jed/Documents/gesturePad

find . -name .DS_Store -ls -exec rm {} \;

rm -r /Users/Jed/Documents/gesturePad/cydia/gesturePad/Applications/gesturePad.app

cp -r /Users/Jed/Documents/gesturePad/build/gesturePad/Build/Products/Debug-iphoneos/gesturePad.app /Users/Jed/Documents/gesturePad/cydia/gesturePad/Applications/gesturePad.app

cd /Users/Jed/Documents/gesturePad/cydia/

dpkg-deb -b gesturePad /Users/Jed/Documents/gesturePad/deb/gesturePad.deb