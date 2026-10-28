import type { NetworkingEventListener } from './events';
import { EventTargetLite } from './events';
export declare class AbortSignal extends EventTargetLite {
    aborted: boolean;
    reason: unknown;
    onabort: NetworkingEventListener | null;
    static abort(reason?: unknown): AbortSignal;
    static timeout(delayMs: number): AbortSignal;
    throwIfAborted(): void;
    __abort(reason?: unknown): void;
}
export declare class AbortController {
    readonly signal: AbortSignal;
    abort(reason?: unknown): void;
}
//# sourceMappingURL=AbortController.d.ts.map