#!/bin/bash

# GSFC Placement Portal — Automated iOS App Build & Xcode Launcher
echo "🍎 Building GSFC University Placement Portal for Apple App Store..."

# Step 1: Build Production Web Bundle
echo "📦 Step 1: Compiling React Production Dist Bundle & Syncing iOS Workspace..."
npm --prefix frontend run build:ios

# Step 2: Open Native Xcode Workspace
if command -v xcode-select &> /dev/null
then
    echo "📱 Step 2: Launching Xcode Workspace (frontend/ios/App/App.xcworkspace)..."
    cd frontend && npx cap open ios
    echo "✅ Xcode workspace opened! Select Product -> Archive to generate your TestFlight build."
else
    echo "⚠️ xcode-select not found. Ensure Xcode is installed from the Mac App Store."
fi

echo "🎉 App Store Packaging assets prepared in ./appstore/"
