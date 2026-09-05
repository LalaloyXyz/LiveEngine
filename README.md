<div align="center">

<img src="https://extensions.gnome.org/extension-data/icons/icon_10873.png" width="128" alt="Live Engine">

# Live Engine

### A live video wallpaper for GNOME Shell.

<br>

![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-46%20%7C%2047%20%7C%2048%20%7C%2049%20%7C%2050-4A86CF)
![Platform](https://img.shields.io/badge/Platform-Linux-FCC624)
![License](https://img.shields.io/badge/License-GPL--3.0-green)

<br><br>

<a href="https://extensions.gnome.org/extension/10873/live-engine/">
  <img src="https://img.shields.io/badge/Download-GNOME%20Extensions-4A86CF?style=for-the-badge" alt="Download from GNOME Extensions">
</a>

<a href="https://buymeacoffee.com/banditpetsw">
  <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-orange?style=for-the-badge" alt="Buy me a coffee">
</a>

<br><br>

<img src="https://extensions.gnome.org/extension-data/screenshots/screenshot_10873.gif" alt="Live Engine preview">

</div>

---

## ✨ Overview

**Live Engine** turns a local video or GIF into a live desktop wallpaper behind
your normal windows. It uses GStreamer and GNOME’s native video stack, with a
Preferences page for choosing the media file and adjusting playback.

## 🎥 Features

- Use video files or animated GIFs as desktop wallpapers
- Choose **Stretch**, **Fit**, or **Cover** scaling
- Loop the wallpaper video
- Adjust wallpaper audio volume from 0–100%
- Support multiple monitors
- Fade the wallpaper in smoothly
- Pause playback while the computer is suspended
- Enable or disable the wallpaper without uninstalling the extension

## 🔧 Requirements

- Linux with GNOME Shell 46, 47, 48, 49, or 50
- GStreamer with the `gtk4paintablesink` video sink
- A local video or GIF file

On Fedora, the required GStreamer components are normally available from the
standard system packages. If the GTK video sink is unavailable, Live Engine
shows a dependency message in Preferences.

## 📦 Installation

### GNOME Extensions

Install Live Engine from the official extension page:

[extensions.gnome.org/extension/10873/live-engine](https://extensions.gnome.org/extension/10873/live-engine/)

You can also search for **Live Engine** in the **Extension Manager** app.
After installation, enable the extension and open its Preferences.

### Manual installation

For development or local testing:

```bash
git clone https://github.com/LalaloyXyz/LiveEngine.git
mkdir -p "$HOME/.local/share/gnome-shell/extensions"
cp -r LiveEngine "$HOME/.local/share/gnome-shell/extensions/LiveEngine@LalaloyXyz"
glib-compile-schemas "$HOME/.local/share/gnome-shell/extensions/LiveEngine@LalaloyXyz/schemas"
gnome-extensions enable LiveEngine@LalaloyXyz
```

If GNOME Shell does not discover the extension, log out and back in, then
enable it again.

## 🚀 Usage

1. Open **Live Engine Preferences**.
2. Click **Browse** and choose a local video or GIF file.
3. Select the desired scaling mode.
4. Set the volume and looping options.
5. Enable **Live wallpaper**.

The wallpaper runs behind application windows and follows monitor and workspace
changes automatically.

## 🛠 Development

Runtime code is in `extension.js`, `core/`, and `player/`. Preferences UI is in
`prefs.js` and `ui/`, while shared helpers are in `utils/`.

There is no automated test suite or build system. After changing the GSettings
schema, regenerate the compiled schema before testing:

```bash
glib-compile-schemas schemas/
```

Manually verify enabling and disabling, Preferences persistence, playback,
monitor changes, Overview/workspace transitions, and suspend/resume behavior.

## 🤝 Contributing

Bug reports, feature requests, and contributions are welcome. Please open an
issue or submit a pull request on [GitHub](https://github.com/LalaloyXyz/LiveEngine).

## 📄 License

Live Engine is free software released under the [GNU General Public License
version 3.0](LICENSE).

<div align="center">

Made with ❤️ for GNOME

</div>
