import type { ReactNode } from 'react';
export type ActivityMode = 'visible' | 'hidden';
/**
 * @internal
 */
export declare function useActivityMode(hideWhenNestedAtLevel?: number): ActivityMode;
/**
 * Wraps the screen contents in a React `Activity` that hides once the screen is buried deep enough
 * in the stack. Hiding runs effect cleanups and releases resources, but keeps React state, so the
 * screen looks unchanged when the user navigates back to it.
 *
 * Must be rendered inside a screen component.
 *
 * @param hideWhenNestedAtLevel How many screens must sit above this one before it hides. `1` hides
 * the screen as soon as it loses focus, which also works in tabs and drawers. Defaults to `2`.
 *
 * > **Note:** This API is unstable and may change or be removed in any release.
 */
export declare function NavigationAwareActivity({ hideWhenNestedAtLevel, children, }: {
    hideWhenNestedAtLevel?: number;
    children: ReactNode;
}): import("react").JSX.Element;
