import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class WorkspaceIntegration {
    constructor() {
        this._source = null;
        this._overviewClones = new Map();
        this._syncId = 0;
    }

    enable(source) {
        this._source = source;
        Main.overview.connectObject(
            'showing', () => {
                this._syncOverview();
                this._queueSync();
            },
            'shown', () => this._syncOverview(),
            'hidden', () => this._clearOverviewClones(),
            this,
        );
        global.workspace_manager.connectObject(
            'notify::n-workspaces', () => this._queueSync(),
            'workspaces-reordered', () => this._queueSync(),
            this,
        );
        if (Main.overview.visible || Main.overview.visibleTarget)
            this._queueSync();
    }

    setSource(source) {
        this._source = source;
        this._clearOverviewClones();
        if (source && (Main.overview.visible || Main.overview.visibleTarget))
            this._queueSync();
    }

    destroy() {
        if (this._syncId) {
            GLib.source_remove(this._syncId);
            this._syncId = 0;
        }
        Main.overview.disconnectObject(this);
        global.workspace_manager.disconnectObject(this);
        this._clearOverviewClones();
        this._source = null;
    }

    _queueSync() {
        if (this._syncId || !this._source ||
            (!Main.overview.visible && !Main.overview.visibleTarget))
            return;
        this._syncId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._syncId = 0;
            this._syncOverview();
            return GLib.SOURCE_REMOVE;
        });
    }

    _syncOverview() {
        const targets = new Map();
        const primaryIndex = Main.layoutManager.primaryIndex;
        const monitor = Main.layoutManager.primaryMonitor;
        const controls = Main.overview._overview?.controls;
        if (!monitor || !controls || !this._source)
            return;

        const workspaceView = controls._workspacesDisplay?._workspacesViews?.[primaryIndex];
        for (const workspace of workspaceView?._workspaces ?? []) {
            const group = workspace._background?._backgroundGroup;
            if (workspace.monitorIndex === primaryIndex && group)
                targets.set(group, {fill: true, above: true});
        }
        for (const thumbnail of controls._thumbnailsBox?._thumbnails ?? []) {
            if (thumbnail.monitorIndex === primaryIndex && thumbnail._contents)
                targets.set(thumbnail._contents, {
                    fill: false,
                    above: false,
                    x: monitor.x,
                    y: monitor.y,
                    width: monitor.width,
                    height: monitor.height,
                });
        }

        for (const [container, clone] of this._overviewClones) {
            if (!targets.has(container) || clone.source !== this._source)
                clone.destroy();
        }
        for (const [container, target] of targets) {
            let clone = this._overviewClones.get(container);
            if (!clone) {
                clone = new Clutter.Clone({source: this._source, reactive: false});
                container.add_child(clone);
                clone.connect('destroy', () => this._overviewClones.delete(container));
                this._overviewClones.set(container, clone);
            }
            if (target.fill) {
                clone.set_size(0, 0);
                clone.set_x_expand(true);
                clone.set_y_expand(true);
            } else {
                clone.set_position(target.x, target.y);
                clone.set_size(target.width, target.height);
                container.set_child_below_sibling(clone, null);
            }
            if (target.above) {
                const baseBackground = container.get_first_child();
                if (baseBackground && baseBackground !== clone)
                    container.set_child_above_sibling(clone, baseBackground);
            }
        }
    }

    _clearOverviewClones() {
        for (const clone of [...this._overviewClones.values()])
            clone.destroy();
        this._overviewClones.clear();
    }
}
