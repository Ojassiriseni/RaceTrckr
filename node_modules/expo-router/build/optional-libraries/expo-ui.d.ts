type ExpoUI = typeof import('@expo/ui/jetpack-compose');
type ExpoUIModifiers = typeof import('@expo/ui/jetpack-compose/modifiers');
export declare function requireExpoUI(errorMessage?: string): {
    expoUI: ExpoUI;
    modifiers: ExpoUIModifiers;
};
export {};
