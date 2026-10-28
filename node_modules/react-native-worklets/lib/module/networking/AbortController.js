'use strict';

import { EventTargetLite } from "./events.js";
export class AbortSignal extends EventTargetLite {
  aborted = false;
  reason = undefined;
  onabort = null;
  static abort(reason) {
    const signal = new AbortSignal();
    signal.__abort(reason);
    return signal;
  }
  static timeout(delayMs) {
    const signal = new AbortSignal();
    setTimeout(() => signal.__abort(makeAbortError('TimeoutError')), delayMs);
    return signal;
  }
  throwIfAborted() {
    if (this.aborted) {
      throw this.reason;
    }
  }
  __abort(reason) {
    if (this.aborted) {
      return;
    }
    this.aborted = true;
    this.reason = reason !== undefined ? reason : makeAbortError('AbortError');
    this.__dispatch('abort');
  }
}
export class AbortController {
  signal = new AbortSignal();
  abort(reason) {
    this.signal.__abort(reason);
  }
}
function makeAbortError(name) {
  const error = new Error(`[Worklets] ${name === 'TimeoutError' ? 'The operation timed out.' : 'The operation was aborted.'}`);
  error.name = name;
  return error;
}
//# sourceMappingURL=AbortController.js.map