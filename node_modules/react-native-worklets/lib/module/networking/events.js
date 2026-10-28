'use strict';

export class EventTargetLite {
  eventListeners = new Map();
  addEventListener(type, listener) {
    let listeners = this.eventListeners.get(type);
    if (listeners === undefined) {
      listeners = new Set();
      this.eventListeners.set(type, listeners);
    }
    listeners.add(listener);
  }
  removeEventListener(type, listener) {
    this.eventListeners.get(type)?.delete(listener);
  }
  __dispatch(type, extra) {
    const event = {
      type,
      target: this,
      loaded: 0,
      total: 0,
      lengthComputable: false,
      ...extra
    };
    const handler = this[`on${type}`];
    if (typeof handler === 'function') {
      this.invokeListener(handler, event);
    }
    const listeners = this.eventListeners.get(type);
    if (listeners !== undefined) {
      for (const listener of Array.from(listeners)) {
        this.invokeListener(listener, event);
      }
    }
  }
  invokeListener(listener, event) {
    try {
      listener.call(this, event);
    } catch (error) {
      console.error(error);
    }
  }
}
//# sourceMappingURL=events.js.map