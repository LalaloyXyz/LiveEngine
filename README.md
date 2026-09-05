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

The recommended way to install Live Engine is through the official GNOME
Extensions website or the Extension Manager application. This keeps the
extension updated and installs it in the correct location automatically.

1. Open the [GNOME Extensions website](https://extensions.gnome.org/) and
   search for **Live Engine**.
2. Select **Install** and confirm the installation in your browser.
3. Open **Extensions** or **Extension Manager**, enable **Live Engine**, and
   open its Preferences to choose a video or GIF.

You can also install it with **Extension Manager**:

1. Open Extension Manager from your application menu.
2. Search for **Live Engine**.
3. Select it, install it, and switch it on.

### Manual installation for development

Manual installation is intended for contributors testing a local checkout.
From the repository directory, run:

```bash
install_dir="$HOME/.local/share/gnome-shell/extensions/LiveEngine@LalaloyXyz"
mkdir -p "$HOME/.local/share/gnome-shell/extensions"
cp -r . "$install_dir"
glib-compile-schemas "$install_dir/schemas"
gnome-extensions enable LiveEngine@LalaloyXyz
```

If GNOME Shell does not discover a manually installed extension, log out and
back in before enabling it.

## Development

Runtime code is in `extension.js`, `core/`, and `player/`; Preferences UI is in `prefs.js` and `ui/`; shared helpers are in `utils/`. There is no automated test suite or build system. After changing `schemas/org.gnome.shell.extensions.liveengine.gschema.xml`, rebuild the compiled schema:

```bash
glib-compile-schemas schemas/
```

Manually verify enabling/disabling, Preferences persistence, playback, monitor changes, Overview/workspace transitions, and suspend/resume on the target GNOME Shell version.
