# LensGuard SE 🔬
Privacy-oriented iPhone SE prototype using REAL on-device sensors, not simulated numbers.

## Project status (November 2026)

This is a **source-code prototype** committed to a separate GitHub branch, not an installed iPhone application and not a tested release. No executable iOS app has been signed, distributed or validated on the user's iPhone yet. Built for Expo SDK 57 / React Native 0.86.3, targeting iOS 26.2 on iPhone SE (2nd or 3rd generation).

## What the source implements

1. **Bluetooth Low Energy (2.4 GHz) discovery**, including live RSSI values (dBm), multiple observations per device and ranked list. Requires the app to be running as a custom native iOS build (not Expo Go).
2. **Magnetometer / magnetic-field inspection**, including three-axis data, field magnitude (μT), scrolling graph, reference baseline and sensitivity threshold. Inspired by the measurement style of phyphox; not a code fork or endorsement.
3. **Manual optical inspection** through the real rear camera, with on/off torch and zoom. No automatic camera-lens classification and no photos or uploads.

No fake 'RF spectrum' display, device identities, false hidden-camera detection scores or background uploads.

## Important scientific limitations

Bluetooth scans see only Bluetooth LE advertising devices; they **do not** detect arbitrary 2.4 GHz traffic, Wi-Fi, cellular transmissions, hidden cameras generally, or broad RF spectrum. RSSI variation can help investigate a BLE source but is heavily influenced by orientation, walls, interference and reflections.

A magnetometer sees magnetic fields. It is **not** a broadband RF sensor, does not reliably detect hidden electronics, and cannot prove the presence or absence of a camera.

The flashlight/camera inspection may reveal lens reflections under favorable geometry but ordinary reflective materials cause false positives. An unremarkable result never proves the room is free of cameras. Refer to USENIX "Sneaky Spy Devices and Defective Detectors" research for real-world concerns about false confidence.

Wi-Fi/Bonjour device discovery on a network you own or have permission to inspect is a plausible future enhancement; it is **not implemented in this commit**. It would only reveal some accessible network devices, not all RF signals.

## Build from a phone without a Mac

A native Bluetooth module cannot run inside the App Store's Expo Go app. The intended route is:
1. Open this GitHub branch in a browser-based coding environment such as **GitHub Codespaces** from the iPhone. Work inside the `lensguard-se` subdirectory.
2. Install dependencies and use Expo's cloud **EAS Build** for an iOS internal distribution / TestFlight build.
3. Sign the build through an **Apple Developer Program membership** and register the iPhone as required by Apple's provisioning process. An Apple Developer paid membership is generally necessary to install this kind of independently built app on a real iPhone.
4. Install the resulting correctly signed iOS build on the iPhone through the link supplied by EAS or TestFlight.

A code repository itself is **not** an installable iPhone app. The source has not been compiled or installed in this session. Apple's signing and distribution restrictions are not bypassed by GitHub or Expo.

## Local commands

```sh
cd lensguard-se
npm install
npx expo install --check
npx expo start
# For an installed iOS build after signing/provisioning:
npx eas-cli build --platform ios --profile preview
```

For Bluetooth, always use a native EAS build. No Mac or external RF sensor is needed, but an Apple developer account is normally needed for the cloud build's iOS signing.

## Privacy

Readings and BLE observations live only in React state while the app is open. No scan history or images are automatically stored or transmitted.

## Research references

- Apple CoreBluetooth RSSI callback: https://developer.apple.com/documentation/corebluetooth/cbcentralmanagerdelegate/centralmanager(_:diddiscover:advertisementdata:rssi:)
- Expo custom BLE app: https://expo.dev/blog/how-to-build-a-bluetooth-low-energy-powered-expo-app
- Expo SDK 57 magnetometer: https://docs.expo.dev/versions/v57.0.0/sdk/magnetometer/
- USENIX: https://www.usenix.org/publications/loginonline/sneaky-spy-devices-and-defective-detectors
