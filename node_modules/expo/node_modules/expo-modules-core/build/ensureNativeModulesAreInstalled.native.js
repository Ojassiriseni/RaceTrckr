import { TurboModuleRegistry } from 'react-native';
/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */ export function ensureNativeModulesAreInstalled() {
    if (globalThis.expo || typeof window === 'undefined') {
        return;
    }
    try {
        // TODO: ExpoModulesCore shouldn't be optional here,
        // but to keep backwards compatibility let's just ignore it in SDK 50.
        // In most cases the modules were already installed from the native side.
        TurboModuleRegistry.get('ExpoModulesCore')?.installModules();
    } catch (error) {
        console.error(`Unable to install Expo modules: ${error}`);
    }
}

//# sourceMappingURL=ensureNativeModulesAreInstalled.native.js.map
