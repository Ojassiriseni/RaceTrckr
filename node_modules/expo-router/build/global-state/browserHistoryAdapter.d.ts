import type { BrowserHistoryAdapter } from './browserHistory.types';
/**
 * Connects reducer-generated history events to `window.history`. It applies commands in order and
 * reports browser-initiated back, forward, and hash changes to the navigation reducer.
 */
export declare function createBrowserHistoryAdapter(): BrowserHistoryAdapter;
