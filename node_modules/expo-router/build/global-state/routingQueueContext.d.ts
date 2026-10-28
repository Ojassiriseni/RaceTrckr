import { type PropsWithChildren, type TransitionStartFunction } from 'react';
import { type QueuedRoutingIntent, type RoutingIntent } from './routingQueue';
import type { NavigationTransitionMode } from './types';
export type RoutingQueueApi = {
    enqueue: (intent: RoutingIntent) => void;
    dequeue: (processed: QueuedRoutingIntent[]) => void;
    startTransition: TransitionStartFunction;
    transitionMode: NavigationTransitionMode;
    setTransitionMode: (mode: NavigationTransitionMode) => void;
};
export declare const RoutingQueueApiContext: import("react").Context<RoutingQueueApi | undefined>;
export declare const PendingIntentsContext: import("react").Context<QueuedRoutingIntent[]>;
export declare const NavigationPendingContext: import("react").Context<boolean>;
export declare function RoutingQueueProvider({ children }: PropsWithChildren): import("react").JSX.Element;
export declare function useEnqueueRoutingIntent(): (intent: RoutingIntent) => void;
export declare function useSetRoutingTransitionMode(): (mode: NavigationTransitionMode) => void;
export declare function ImperativeRoutingQueueBridge({ enqueue, setTransitionMode, }: Pick<RoutingQueueApi, 'enqueue' | 'setTransitionMode'>): null;
