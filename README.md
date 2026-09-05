# Live Engine

Live Engine is a GNOME Shell extension that renders a video or GIF as a live desktop wallpaper behind normal windows. Playback uses GStreamer through GNOME’s native video stack.

## Features

- Video and GIF wallpapers with cover, fit, and stretch scaling
- Multi-monitor support
- Adjustable frame rate, fade-in, blur, brightness, audio, and looping
- Automatic pause while the computer is suspended

## Requirements

- GNOME Shell 46–50
- GStreamer with the GTK4 video sink (`gtk4paintablesink`)
- A local video or GIF file

On Fedora, the required GStreamer components are normally available from the standard system packages. The extension reports a dependency error in Preferences when the video sink cannot be found.

## Installation

Install from a local checkout using the UUID in `metadata.json`:

```bash
install_dir="$HOME/.local/share/gnome-shell/extensions/LiveEngine@LalaloyXyz"
mkdir -p "$HOME/.local/share/gnome-shell/extensions"
cp -r . "$install_dir"
glib-compile-schemas "$install_dir/schemas"
gnome-extensions enable LiveEngine@LalaloyXyz
```

Open the extension’s Preferences, choose a video or GIF, and adjust playback settings. If GNOME Shell does not discover the extension, log out and back in before enabling it.

## Development

Runtime code is in `extension.js`, `core/`, and `player/`; Preferences UI is in `prefs.js` and `ui/`; shared helpers are in `utils/`. There is no automated test suite or build system. After changing `schemas/org.gnome.shell.extensions.liveengine.gschema.xml`, rebuild the compiled schema:

```bash
glib-compile-schemas schemas/
```

Manually verify enabling/disabling, Preferences persistence, playback, monitor changes, Overview/workspace transitions, and suspend/resume on the target GNOME Shell version.
