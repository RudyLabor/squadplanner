#!/bin/bash
# Script de build mobile Squad Planner

set -e

echo "Building web assets..."
npm run build

echo "Syncing with Capacitor..."
npx cap sync

if [ "$1" = "android" ] || [ "$1" = "both" ]; then
  echo "Building Android..."
  cd android && ./gradlew assembleRelease && cd ..
  echo "Android APK: android/app/build/outputs/apk/release/"
fi

if [ "$1" = "ios" ] || [ "$1" = "both" ]; then
  echo "Building iOS..."
  cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive && cd ../..
  echo "iOS archive built"
fi

echo "Build complete!"
