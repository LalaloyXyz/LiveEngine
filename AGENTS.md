# Repository Guidelines

## Project Structure & Module Organization

This repository is a GNOME Shell extension that plays video behind desktop windows. `extension.js` and `prefs.js` are the GNOME entrypoints. Runtime engine code lives in `core/` (`core_process.js` manages GStreamer); the child video player lives in `player/`. Keep UI preference pages in `ui/` and shared GNOME/GJS helpers in `utils/`. Settings keys are defined in `enums.js`, while the GSettings schema is in `schemas/org.gnome.shell.extensions.liveengine.gschema.xml`. `metadata.json` defines the extension UUID and supported Shell versions.

## Build, Test, and Development Commands

There is no Node package, build system, or automated test suite in this checkout. Develop with GNOME's GJS runtime and test on a supported GNOME Shell session.

```bash
cp -r . ~/.local/share/gnome-shell/extensions/LiveEngine@LalaloyXyz
gnome-extensions enable LiveEngine@LalaloyXyz
```

After changing the XML schema, regenerate its compiled form before testing:

```bash
glib-compile-schemas schemas/
```

Exercise GStreamer playback when changing video behavior. Verify extension enablement, preferences, Overview/workspace transitions, and multi-monitor behavior manually.

## Coding Style & Naming Conventions

Use ES modules and GNOME's `gi://` and `resource:///` imports. Match the surrounding file: four-space indentation in extension/runtime code, semicolons, single-quoted relative imports, and `PascalCase` classes (for example, `GstPlayerProcess`). Use `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for constants, and underscore-prefixed instance fields such as `this._player`. Preserve existing import grouping and avoid unrelated formatting changes.

Keep settings names centralized in `Keys`; schema changes and UI controls must use the same key. Be careful with GNOME Shell APIs that vary by version—`utils/shell_version.js` is the established compatibility boundary.

## Testing Guidelines

No test framework or coverage target is configured. Include focused manual verification in each change: describe GNOME Shell version, selected backend, and the user-visible scenario tested. For schema or preferences changes, confirm defaults, persistence, and that the preferences window opens without errors.

## Commit & Pull Request Guidelines

Git history is not included in this working copy, so no local commit convention can be inferred. Use short, imperative subjects scoped to the change, e.g. `Fix wallpaper cleanup on disable`. Pull requests should explain the behavior change, list manual test conditions, link relevant issues, and include screenshots for preference/UI changes. Do not commit local media files, generated logs, or machine-specific paths.
