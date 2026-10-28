import { CodedError } from '../errors/CodedError';
import { requireOptionalNativeModule } from '../requireNativeModule';
if (__DEV__ && typeof window !== 'undefined' && (process.env.EXPO_OS === 'android' || process.env.EXPO_OS === 'ios')) {
    const NativeJSLogger = requireOptionalNativeModule('ExpoModulesCoreJSLogger');
    if (NativeJSLogger) {
        const onNewException = {
            eventName: 'ExpoModulesCoreJSLogger.onNewError',
            action: console.error
        };
        const onNewWarning = {
            eventName: 'ExpoModulesCoreJSLogger.onNewWarning',
            action: console.warn
        };
        const onNewDebug = {
            eventName: 'ExpoModulesCoreJSLogger.onNewDebug',
            action: console.debug
        };
        const onNewInfo = {
            eventName: 'ExpoModulesCoreJSLogger.onNewInfo',
            action: console.info
        };
        const onNewTrace = {
            eventName: 'ExpoModulesCoreJSLogger.onNewTrace',
            action: console.trace
        };
        const listeners = [
            onNewException,
            onNewWarning,
            onNewDebug,
            onNewInfo,
            onNewTrace
        ];
        for (const listener of listeners){
            NativeJSLogger.addListener(listener.eventName, ({ message })=>{
                listener.action(message);
            });
        }
    }
}
// We have to export `CodedError` via global object to use in later in the C++ code.
globalThis.ExpoModulesCore_CodedError = CodedError;

//# sourceMappingURL=setUpJsLogger.fx.js.map
