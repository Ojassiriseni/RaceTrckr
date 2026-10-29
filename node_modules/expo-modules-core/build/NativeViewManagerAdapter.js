import { UnavailabilityError } from './errors/UnavailabilityError';
/**
 * A drop-in replacement for `requireNativeComponent`.
 */ export function requireNativeViewManager(moduleName, viewName) {
    throw new UnavailabilityError('expo-modules-core', 'requireNativeViewManager');
}

//# sourceMappingURL=NativeViewManagerAdapter.js.map
