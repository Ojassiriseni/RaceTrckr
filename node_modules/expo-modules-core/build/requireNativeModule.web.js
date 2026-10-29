export function requireNativeModule(moduleName) {
    const nativeModule = requireOptionalNativeModule(moduleName);
    if (nativeModule != null) {
        return nativeModule;
    }
    if (typeof window === 'undefined') {
        // For SSR, we expect not to have native modules available, but to avoid crashing from SSR resolutions, we return an empty object.
        return {};
    }
    throw new Error(`Cannot find native module '${moduleName}'`);
}
export function requireOptionalNativeModule(moduleName) {
    if (typeof globalThis.ExpoDomWebView === 'object' && globalThis?.expo?.modules != null) {
        return globalThis.expo?.modules?.[moduleName] ?? null;
    }
    return null;
}

//# sourceMappingURL=requireNativeModule.web.js.map
