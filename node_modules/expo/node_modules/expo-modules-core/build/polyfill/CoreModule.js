export class EventEmitter {
    listeners;
    addListener(eventName, listener) {
        if (!this.listeners) {
            this.listeners = new Map();
        }
        if (!this.listeners?.has(eventName)) {
            this.listeners?.set(eventName, new Set());
        }
        const previousListenerCount = this.listenerCount(eventName);
        this.listeners?.get(eventName)?.add(listener);
        if (previousListenerCount === 0 && this.listenerCount(eventName) === 1) {
            this.startObserving(eventName);
        }
        return {
            remove: ()=>{
                this.removeListener(eventName, listener);
            }
        };
    }
    removeListener(eventName, listener) {
        const hasRemovedListener = this.listeners?.get(eventName)?.delete(listener);
        if (this.listenerCount(eventName) === 0 && hasRemovedListener) {
            this.stopObserving(eventName);
        }
    }
    removeAllListeners(eventName) {
        const previousListenerCount = this.listenerCount(eventName);
        this.listeners?.get(eventName)?.clear();
        if (previousListenerCount > 0) {
            this.stopObserving(eventName);
        }
    }
    emit(eventName, ...args) {
        const listeners = new Set(this.listeners?.get(eventName));
        listeners.forEach((listener)=>{
            // When the listener throws an error, don't stop the execution of subsequent listeners and
            // don't propagate the error to the `emit` function. The motivation behind this is that
            // errors thrown from a module or user's code shouldn't affect other modules' behavior.
            try {
                listener(...args);
            } catch (error) {
                console.error(error);
            }
        });
    }
    listenerCount(eventName) {
        return this.listeners?.get(eventName)?.size ?? 0;
    }
    startObserving(eventName) {}
    stopObserving(eventName) {}
}
export class NativeModule extends EventEmitter {
    ViewPrototypes;
    __expo_module_name__;
}
export class SharedObject extends EventEmitter {
    release() {
    // no-op on Web, but subclasses can override it if needed.
    }
}
export class SharedRef extends SharedObject {
    nativeRefType = 'unknown';
}

//# sourceMappingURL=CoreModule.js.map
