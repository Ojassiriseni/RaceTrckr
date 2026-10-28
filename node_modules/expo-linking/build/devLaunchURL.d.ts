/**
 * Resolves a launch URL to the URL the app should handle.
 *
 * Expo Go and development builds accept
 * [launcher commands](/develop/development-builds/development-workflows/#deep-linking-to-an-updates-url)
 * as reserved `__expo_*` query parameters on any URL, or through the legacy
 * `expo-development-client` host with a `url` parameter. This function returns the target URL named
 * by `__expo_url` (or the legacy `url`), or the given URL without its reserved parameters. If the
 * URL is invalid or carries no launcher command, the function returns it unchanged.
 *
 * @param url A URL received by the app, for example from `Linking.getInitialURL()`.
 * @return The URL the app should handle, or an empty string for a legacy launch URL without a
 * target.
 *
 * @example
 * ```ts
 * unwrapDevLaunchURL('myapp://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081%2F--%2Fprofile');
 * // 'http://10.0.0.5:8081/--/profile'
 * unwrapDevLaunchURL('myapp://login?__expo_disable_fab=1');
 * // 'myapp://login'
 * ```
 */
export declare function unwrapDevLaunchURL(url: string): string;
