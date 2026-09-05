import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as LoginManager from 'resource:///org/gnome/shell/misc/loginManager.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';

import {Keys, ScalingMode} from './enums.js';
import {GstPlayerProcess} from './core/core_process.js';

import {SHELL_VERSION} from './utils/shell_version.js';
import {logWarn, logError} from './utils/logging.js';
import {isGtk4PaintableSinkAvailable} from './utils/check_dependencies.js';
import {sendErrorNotification} from './utils/notifications.js';
import {WorkspaceIntegration} from './core/workspace_integration.js';

const WINDOW_TIMEOUT = 10000;
const WALLPAPER_ANIMATION_MS = 350;

export default class LiveEngineExtension extends Extension {
    enable() {
        this._resetState();
        this._settings = this.getSettings();
        this._settings.connectObject(
            'changed::general-enabled', () => this._syncEnabledState(),
            'changed::background-video-path', () => this._restartWallpaper(),
            'changed::background-video-scaling-mode', () => this._updateScalingMode(),
            this,
        );
        this._syncEnabledState();
    }

    _resetState() {
        this._backgroundActors = [];
        this._windowActor = null;
        this._window = null;
        this._player = null;
        this._loginManager = null;
        this._workspaceIntegration = null;
        this._starting = false;
        this._fullscreenPaused = false;
        this._settings = null;
    }

    _syncEnabledState() {
        if (this._settings.get_boolean(Keys.ENABLED)) {
            this._startWallpaper().catch(err => logError(err));
        } else {
            this._stopWallpaper();
        }
    }

    _restartWallpaper() {
        if (!this._settings.get_boolean(Keys.ENABLED))
            return;

        this._stopWallpaper();
        this._startWallpaper().catch(err => logError(err));
    }

    _updateScalingMode() {
        if (!this._player)
            return;

        this._scalingMode = this._settings.get_int(Keys.SCALING_MODE);
        this._createBackgrounds();
        this._workspaceIntegration?.setSource(
            this._backgroundActors[Main.layoutManager.primaryIndex]
        );
    }

    async _startWallpaper() {
        if (this._starting || this._player || !this._settings.get_boolean(Keys.ENABLED))
            return;

        this._starting = true;
        const videoPath = this._settings.get_string(Keys.VIDEO_PATH);
        if (!videoPath) {
            logWarn('Video not set');
            this._starting = false;
            return;
        }

        if (!isGtk4PaintableSinkAvailable()) {
            sendErrorNotification(
                'The system GStreamer GTK video sink is unavailable.'
            );
            this._starting = false;
            return;
        }

        this._scalingMode = this._settings.get_int(Keys.SCALING_MODE);
        this._fadeInDuration = 500;
        this._blurEffect = {
            name: 'live-engine-blur',
            radius: 0,
            brightness: 0.65,
        };

        this._player = new GstPlayerProcess({
            playerPath: `${this.path}/player/run.js`,
            videoPath,
            scalingMode: this._scalingMode,
            loop: this._settings.get_boolean(Keys.LOOPED),
            volume: this._settings.get_int(Keys.AUDIO_VOLUME) / 100,
            useVideorate: false,
            framerate: 25,
            // Use the direct GTK sink to avoid the extra GL conversion
            // buffers used by the color-accurate path.
            colorAccurate: false,
        });

        try {
            await this._player.run();
            if (!this._settings.get_boolean(Keys.ENABLED)) {
                this._stopWallpaper();
                return;
            }
        await this._attachWallpaper();
        this._initPowerManagement();
        this._initFullscreenPause();
        } finally {
            this._starting = false;
        }
    }

    async _attachWallpaper() {
        this._window = await this._player.waitForWindow(WINDOW_TIMEOUT);
        this._windowActor = this._window.get_compositor_private();

        try {
            this._window.hide_from_window_list();
        } catch (err) {
            logWarn(`Could not hide helper window from the window list: ${err}`);
        }

        try {
            if (typeof this._window.set_skip_taskbar === 'function')
                this._window.set_skip_taskbar(true);
            else
                this._window.skip_taskbar = true;
            if ('skip_pager' in this._window)
                this._window.skip_pager = true;
        } catch (err) {
            logWarn(`Could not hide helper window from the taskbar: ${err}`);
        }

        try {
            this._window.unmake_fullscreen?.();
            if (SHELL_VERSION > 48)
                this._window.unmaximize();
            else
                this._window.unmaximize(true);
            this._window.stick?.();
            this._window.lower?.();
        } catch (err) {
            logWarn(`Could not clear helper window state: ${err}`);
        }

        if (this._player.shouldResize)
            this._window.move_resize_frame(true, 0, 0, this._player.w, this._player.h);

        const parent = this._windowActor.get_parent();
        if (parent)
            parent.remove_child(this._windowActor);

        global.stage.add_child(this._windowActor);
        global.stage.set_child_below_sibling(this._windowActor, null);
        this._windowActor.opacity = 0;

        this._createBackgrounds();
        this._workspaceIntegration = new WorkspaceIntegration();
        this._workspaceIntegration.enable(this._backgroundActors[Main.layoutManager.primaryIndex]);
        Main.layoutManager.connectObject('monitors-changed', () => {
            this._createBackgrounds();
            this._workspaceIntegration?.setSource(
                this._backgroundActors[Main.layoutManager.primaryIndex]
            );
        }, this);
        this._player.play();
    }

    _createBackgrounds() {
        this._destroyBackgrounds();

        const backgroundGroup = Main.layoutManager._backgroundGroup;
        if (!backgroundGroup)
            throw new Error('GNOME Shell background group is unavailable');

        for (const monitor of Main.layoutManager.monitors) {
            const background = new Clutter.Actor({
                reactive: false,
                opacity: 0,
                x: monitor.x,
                y: monitor.y,
                width: monitor.width,
                height: monitor.height,
                clip_to_allocation: true,
            });
            const clone = new Clutter.Clone({source: this._windowActor});

            background.add_effect(new Shell.BlurEffect(this._blurEffect));
            background.add_child(clone);
            this._applyScaling(clone, monitor.width, monitor.height);

            backgroundGroup.add_child(background);
            // Keep the wallpaper above GNOME's opaque base background, but
            // below the widgets layer when that extension is present.
            const widgetsLayer = backgroundGroup.get_children?.().find(child =>
                child !== background && child.get_style_class_name?.() === 'widget-layer'
            );
            if (widgetsLayer)
                backgroundGroup.set_child_below_sibling(background, widgetsLayer);
            else
                backgroundGroup.set_child_above_sibling(background, null);
            this._backgroundActors.push(background);
        }

        for (const background of this._backgroundActors) {
            background.ease({
                opacity: 255,
                duration: this._fadeInDuration,
                mode: Clutter.AnimationMode.EASE_IN_QUAD,
            });
        }
    }

    _applyScaling(clone, targetW, targetH) {
        const {w, h} = this._player;
        clone.set_size(w, h);

        switch (this._scalingMode) {
            case ScalingMode.STRETCH:
                clone.set_scale(targetW / w, targetH / h);
                clone.set_position(0, 0);
                break;
            case ScalingMode.FIT: {
                const scale = Math.min(targetW / w, targetH / h);
                clone.set_scale(scale, scale);
                clone.set_position((targetW - w * scale) / 2, (targetH - h * scale) / 2);
                break;
            }
            default: {
                const scale = Math.max(targetW / w, targetH / h);
                clone.set_scale(scale, scale);
                clone.set_position((targetW - w * scale) / 2, (targetH - h * scale) / 2);
            }
        }
    }

    _initPowerManagement() {
        this._loginManager = LoginManager.getLoginManager();
        this._loginManager.connectObject('prepare-for-sleep', (_manager, aboutToSleep) => {
            if (aboutToSleep)
                this._player?.pause();
            else
                this._player?.play();
        }, this);
    }

    _initFullscreenPause() {
        global.display.connectObject('notify::focus-window', () => {
            this._watchFocusedWindow();
        }, this);
        this._watchFocusedWindow();
    }

    _watchFocusedWindow() {
        this._focusedWindow?.disconnectObject(this);
        this._focusedWindow = global.display.focus_window;
        this._focusedWindow?.connectObject('notify::fullscreen', () => {
            this._syncFullscreenPause();
        }, this);
        this._syncFullscreenPause();
    }

    _syncFullscreenPause() {
        if (!this._player) {
            return;
        }

        const focused = global.display.focus_window;
        const isFullscreen = focused && focused !== this._window &&
            (focused.is_fullscreen?.() ?? focused.fullscreen);
        if (isFullscreen && !this._fullscreenPaused) {
            this._fullscreenPaused = true;
            this._player.pause();
            this._animateWallpaper(0);
        } else if (!isFullscreen && this._fullscreenPaused) {
            this._fullscreenPaused = false;
            this._player.play();
            this._animateWallpaper(255);
        }
    }

    _animateWallpaper(opacity) {
        for (const actor of this._backgroundActors) {
            actor.ease({
                opacity,
                duration: WALLPAPER_ANIMATION_MS,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        }
    }

    _destroyBackgrounds() {
        for (const background of this._backgroundActors)
            background.destroy();
        this._backgroundActors = [];
    }

    _stopWallpaper() {
        Main.layoutManager.disconnectObject(this);
        this._loginManager?.disconnectObject(this);
        global.display.disconnectObject(this);
        this._focusedWindow?.disconnectObject(this);
        this._focusedWindow = null;
        this._workspaceIntegration?.destroy();
        this._destroyBackgrounds();

        if (this._windowActor)
            this._windowActor.hide();
        this._player?.destroy();
        this._windowActor = null;
        this._window = null;
        this._player = null;
        this._loginManager = null;
        this._workspaceIntegration = null;
        this._fullscreenPaused = false;
    }

    disable() {
        this._settings?.disconnectObject(this);
        this._stopWallpaper();
        this._resetState();
    }
}
