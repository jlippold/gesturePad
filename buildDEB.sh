#!/bin/bash

cd /Users/TreAson/gesturePad

find . -name .DS_Store -ls -exec rm {} \;

rm -r /Users/TreAson/gesturePad/cydia/gesturePad/Applications/gesturePad.app/

cp -r /Users/TreAsoN/gesturePad/build/Debug-iphoneos/gesturePad.app /Users/TreAson/gesturePad/cydia/gesturePad/Applications/gesturePad.app/

cd /Users/TreAson/gesturePad/cydia/

dpkg-deb -b gesturePad /Users/TreAson/gesturePad/deb/gesturePad.deb