'use client';
import { useEffect, useInsertionEffect, useRef } from 'react';
function dependenciesAreEqual(previousDependencies, dependencies) {
    return previousDependencies.length === dependencies.length && dependencies.every((value, index)=>Object.is(value, previousDependencies[index]));
}
function selectSnapshot(lifecycle, dependencies, candidate, committed) {
    if (candidate && !candidate.resource.isDisposed && dependenciesAreEqual(candidate.dependencies, dependencies)) {
        return candidate;
    }
    const previous = committed?.resource.isDisposed ? undefined : committed;
    if (previous && dependenciesAreEqual(previous.dependencies, dependencies)) {
        return previous;
    }
    if (previous && previous.resource.object != null && lifecycle.shouldRecreate?.(previous.resource.object, {
        previousDependencies: previous.dependencies,
        dependencies
    }) === false) {
        return {
            resource: previous.resource,
            dependencies: [
                ...dependencies
            ]
        };
    }
    return {
        resource: new SharedObjectResource(lifecycle.factory()),
        dependencies: [
            ...dependencies
        ]
    };
}
/**
 * Returns a shared object, delegating dependency changes to lifecycle callbacks.
 */ export function useReleasingSharedObjectWithLifecycle(lifecycle, dependencies) {
    const state = useRef({});
    // Cache the render's selection, but base lifecycle decisions on the last commit.
    // An interrupted render must not update or release the committed object.
    const selected = selectSnapshot(lifecycle, dependencies, state.current.candidate, state.current.committed);
    state.current.candidate = selected;
    const resource = selected.resource;
    // Use an insertion effect so hiding an [`Activity`](https://react.dev/reference/react/Activity) does not release the object.
    // Save the latest committed release callback for when the object is eventually released.
    useInsertionEffect(()=>{
        resource.release = lifecycle.release ?? ((object)=>object?.release());
        return resource.retain();
    });
    // Keep the object retained after insertion cleanup so consumers can still call it from
    // useEffect cleanup (e.g. player.pause()). `useInsertionEffect` cleanup runs before `useEffect` cleanup
    useEffect(()=>resource.retain(), [
        resource
    ]);
    // Apply committed dependency changes once, including when effects replay or reconnect.
    useEffect(()=>{
        const previous = state.current.committed;
        state.current.committed = selected;
        if (previous?.resource === resource && !dependenciesAreEqual(previous.dependencies, selected.dependencies)) {
            resource.track(lifecycle.update?.(resource.object, {
                previousDependencies: previous.dependencies,
                dependencies: selected.dependencies
            }));
        }
    });
    return resource.object;
}
// Pending work and disposal belong to each object, including objects replaced by a later render.
class SharedObjectResource {
    object;
    // Effects and pending updates each retain the object for as long as they need it.
    retainCount = 0;
    disposed = false;
    release = (object)=>object?.release();
    constructor(object){
        this.object = object;
    }
    get isDisposed() {
        return this.disposed;
    }
    retain() {
        if (this.disposed) {
            throw new Error('Cannot reuse a released shared object. Remount the component to create a new one.');
        }
        this.retainCount++;
        return ()=>{
            if (--this.retainCount > 0) return;
            // Recheck after effect replay and synchronous consumer cleanup have finished.
            Promise.resolve().then(()=>{
                if (this.retainCount === 0 && !this.disposed) {
                    this.disposed = true;
                    if (this.object != null) this.release(this.object);
                }
            }).catch((error)=>console.error(error));
        };
    }
    // Keeps the shared object alive until the provided task finishes
    track(task) {
        if (!task) return;
        const releaseUpdate = this.retain();
        Promise.resolve(task).catch((error)=>console.error(error)).then(releaseUpdate);
    }
}

//# sourceMappingURL=useReleasingSharedObjectWithLifecycle.js.map
