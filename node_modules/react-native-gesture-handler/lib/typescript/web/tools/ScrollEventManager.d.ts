import type { AdaptedEvent } from '../interfaces';
import EventManager from './EventManager';
export default class ScrollEventManager extends EventManager<HTMLElement> {
    private scrollCallback;
    registerListeners(): void;
    unregisterListeners(): void;
    protected mapEvent(event: Event): AdaptedEvent;
}
//# sourceMappingURL=ScrollEventManager.d.ts.map