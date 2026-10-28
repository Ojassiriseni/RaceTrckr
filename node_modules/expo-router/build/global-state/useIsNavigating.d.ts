/**
 * Returns whether a navigation is queued or its state update is pending.
 *
 * The current screen can remain visible while this returns `true` if the destination suspends.
 * `navigation.dispatchSync` bypasses the queue, and native back gestures never enter it, so this
 * hook does not report navigation triggered by either one.
 * Returns `false` when called outside an Expo Router root.
 *
 * @experimental
 */
export declare function useIsNavigating(): boolean;
