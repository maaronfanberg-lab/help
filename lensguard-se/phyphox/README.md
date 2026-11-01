# LensGuard SE: iPhone-only, no developer membership

These are **custom experiments for the free phyphox iPhone app**. They are runnable configurations, not apps you must compile. No Mac, Apple Developer membership or external hardware required.

## Download and open on iPhone SE (iOS 26.2)

1. Install [phyphox](https://apps.apple.com/us/app/phyphox/id1127319693) if not installed already.
2. Open one of these file links on your iPhone:
   - [LensGuard Magnetic Spectrum](https://raw.githubusercontent.com/maaronfanberg-lab/help/lensguard-se/lensguard-se/phyphox/LensGuard-Magnetic-Spectrum.phyphox)
   - [LensGuard Acoustic Clues](https://raw.githubusercontent.com/maaronfanberg-lab/help/lensguard-se/lensguard-se/phyphox/LensGuard-Acoustic-Clues.phyphox)
3. If Safari shows XML text instead of importing: open the [GitHub folder](https://github.com/maaronfanberg-lab/help/tree/lensguard-se/lensguard-se/phyphox), tap the experiment file, select **Download raw file**, then find the downloaded file in iPhone **Files**. Use its Share sheet to select **phyphox** or **Copy to phyphox** (labels can vary). See [official import instructions](https://phyphox.org/docs/transferring-experiments/).
4. The imported experiments are under category **LensGuard SE** in phyphox. Tap **play** to measure and export CSV if desired.
5. No import necessary for basic measurements: phyphox already includes **Tools > Magnetic Spectrum** and **Acoustics > Audio Spectrum**.

## What each experiment does

**LensGuard Magnetic Spectrum:** three-axis magnetometer Fourier-transform analysis as in phyphox's original experiment, plus an added Start / Field tab containing real magnetic-field magnitude, measurement history, compass accuracy, and step-by-step guidance.

**LensGuard Acoustic Clues:** the phyphox Audio Spectrum instrument with a Start / Safety tab explaining how to check for repeatable audible power-supply noise using the microphone.

These configurations preserve Phyphox's original analysis engines and display actual iPhone sensor values. **Not physically tested on an iPhone SE yet.** If a custom file fails to import, use the included original Phyphox experiment immediately.

## Add real Bluetooth and local-network discovery without coding

- [nRF Connect for Mobile](https://apps.apple.com/us/app/nrf-connect-for-mobile/id1054362403) scans nearby Bluetooth Low Energy advertising devices and shows signal-strength RSSI (dBm). It cannot scan arbitrary RF signals or reliably determine which devices have cameras.
- [Network Analyzer: WiFi Scan](https://apps.apple.com/us/app/network-analyzer-wifi-scan/id562315041) can list some reachable devices on a local network you are authorized to examine. It cannot see unknown Wi-Fi networks' devices, silent devices, or disconnected cameras.
- For manual lens inspection, the iPhone Camera and its built-in flashlight can sometimes show lens glints at certain angles. Many non-camera objects also reflect light.

## Scientific boundaries and good controls

**These are experiments, not concealed-camera detection guarantees.** Magnetometers measure magnetic fields, not radio-frequency power at 433 MHz, 900 MHz, 2.4 GHz, 5 GHz, etc. Sometimes electronic circuits create secondary low-frequency magnetic fluctuations and audible whine, but those phenomena cannot identify hidden cameras. The highest meaningful frequency in Magnetic Spectrum is one half of the sensor acquisition rate; check its on-screen Nyquist value.

Suggested checks:

1. Record a baseline with the phone stationary and away from obvious magnets, speakers, and chargers.
2. Move slowly toward an object and hold still. Changes caused solely by rotating the phone relative to Earth's field are not useful evidence.
3. Compare repeatedly with a known powered electronic device, a plain magnet or speaker, and an ordinary object.
4. Observe whether anomalies recur in the same conditions. A change or sound is not evidence of a camera; no change does not rule one out.
5. Avoid opening electrical outlets or touching potentially unsafe equipment.

## Open-source attribution

Adapted from the **phyphox-experiments** repository:
- [Original Magnetic Spectrum](https://github.com/phyphox/phyphox-experiments/blob/master/mag_spectrum.phyphox)
- [Original Audio Spectrum](https://github.com/phyphox/phyphox-experiments/blob/master/audio_spectrum.phyphox)

The original code is under **GNU General Public License version 3**. Our derivative configurations remain under GPL-3.0. See [LICENSE-GPL-3.0.txt](LICENSE-GPL-3.0.txt). Modifications: experiment title, category, description, additional guidance views, and an added magnetic-field magnitude view. Independent of, and not endorsed by, phyphox / RWTH Aachen University.
