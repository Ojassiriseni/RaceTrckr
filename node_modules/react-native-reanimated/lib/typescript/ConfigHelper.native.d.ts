import type { LogFunction, LoggerConfig } from './common';
/**
 * Updates Reanimated logger config with the user-provided configuration. Will
 * affect Reanimated code executed after call to this function so it should be
 * called before any Reanimated code is executed to take effect. Each call to
 * this function will override the previous configuration (it's recommended to
 * call it only once).
 *
 * @param config - The new logger configuration to apply.
 * @param onLog - Optional callback invoked for every log, in addition to the
 *   default console output. Logs raised on the UI runtime are delivered
 *   asynchronously, on the React Native Runtime.
 */
export declare function configureReanimatedLogger(config: LoggerConfig, onLog?: LogFunction): void;
//# sourceMappingURL=ConfigHelper.native.d.ts.map