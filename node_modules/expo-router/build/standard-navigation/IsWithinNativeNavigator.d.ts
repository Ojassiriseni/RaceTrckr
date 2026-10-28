/**
 * Indicates that descendants are rendered inside a native navigator.
 * Native navigator integrations should provide `true` so incompatible nested navigators can fail
 * before reaching the native view hierarchy.
 */
export declare const IsWithinNativeNavigator: import("react").Context<boolean>;
