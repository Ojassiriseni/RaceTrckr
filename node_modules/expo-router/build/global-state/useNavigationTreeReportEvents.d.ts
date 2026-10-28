import type { BrowserHistoryAdapter } from './browserHistory.types';
import type { NavigationTreeReport } from './useNavigationTreeReducer';
export declare function useNavigationTreeReportEvents(report: NavigationTreeReport | undefined, consumeReportEvents: (eventIds: readonly number[]) => void, browserHistory: BrowserHistoryAdapter): void;
