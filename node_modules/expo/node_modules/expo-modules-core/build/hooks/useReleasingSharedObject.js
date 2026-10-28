'use client';
import { useReleasingSharedObjectWithLifecycle } from './useReleasingSharedObjectWithLifecycle';
/**
 * Returns a shared object, which is automatically cleaned up when the component is unmounted.
 */ export function useReleasingSharedObject(factory, dependencies) {
    return useReleasingSharedObjectWithLifecycle({
        factory
    }, dependencies);
}

//# sourceMappingURL=useReleasingSharedObject.js.map
