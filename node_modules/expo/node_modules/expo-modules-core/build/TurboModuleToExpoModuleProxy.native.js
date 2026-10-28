// Copyright © 2024 650 Industries.
export function createTurboModuleToExpoProxy(turboModule, name) {
    if (!turboModule) return null;
    const expoModuleProxy = {
        __turboModule: turboModule
    };
    Object.keys(Object.getPrototypeOf(turboModule)).forEach((prop)=>{
        expoModuleProxy[prop] = turboModule[prop];
    });
    if (turboModule.getConstants) {
        const constants = turboModule.getConstants();
        Object.keys(constants).forEach((prop)=>{
            expoModuleProxy[prop] = constants[prop];
        });
    }
    expoModuleProxy.addListener = (eventName, listener)=>{
        const eventEmitter = turboModule[eventName];
        return eventEmitter(listener);
    };
    return expoModuleProxy;
}

//# sourceMappingURL=TurboModuleToExpoModuleProxy.native.js.map
