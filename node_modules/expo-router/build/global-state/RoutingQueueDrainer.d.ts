import type { QueuedRoutingIntent, RoutingIntent } from './routingQueue';
import type { NavigationTransitionMode } from './types';
type Props = {
    processIntent: (intent: QueuedRoutingIntent, inTransition: boolean) => void;
};
export declare function shouldUseTransition(intents: RoutingIntent[], mode: NavigationTransitionMode): boolean;
export declare function RoutingQueueDrainer({ processIntent }: Props): null;
export {};
