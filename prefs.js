import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { GeneralPage } from "./ui/general_page.js";
import { DependencyErrorPage } from "./ui/dependency_error_page.js";

import { isGtk4PaintableSinkAvailable } from './utils/check_dependencies.js';

export default class LLSPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        window.set_default_size(500, 600);
        window.set_search_enabled(true);

        if (!isGtk4PaintableSinkAvailable()) {
            window.add(new DependencyErrorPage());
            return;
        }

        window.add(new GeneralPage(settings));
    }
}
