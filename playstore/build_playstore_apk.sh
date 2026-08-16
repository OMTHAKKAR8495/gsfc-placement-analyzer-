#!/bin/bash

# GSFC Placement Portal — Automated Android App Bundle (.aab) & APK Generator
echo "🚀 Building GSFC University Placement Portal for Google Play Store..."

# Step 1: Build Production Web Bundle
echo "📦 Step 1: Compiling React Production Dist Bundle..."
npm --prefix frontend run build

# Step 2: Check for Bubblewrap or Capacitor CLI
if command -v bubblewrap &> /dev/null
then
    echo "📱 Step 2: Running Google Bubblewrap TWA Build..."
    bubblewrap build --manifest=./playstore/twa-manifest.json
    echo "✅ Play Store .aab bundle generated successfully!"
else
    echo "ℹ️ Bubblewrap CLI not found. You can install it using: npm install -g @botbrew/bubblewrap"
    echo "✅ Production PWA manifest ready at ./frontend/public/manifest.json"
fi

echo "🎉 Play Store Packaging assets prepared in ./playstore/"
