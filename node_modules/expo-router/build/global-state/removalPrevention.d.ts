import * as React from 'react';
import { type PropsWithChildren } from 'react';
import type { NavigationAction } from '../react-navigation/routers';
type RemovalEventType = 'removePrevented' | 'removed';
type RemovalEventEmitter = (type: RemovalEventType, action: NavigationAction) => void;
type RouteRemovalEventEmitter = (routeKey: string, type: RemovalEventType, action: NavigationAction) => void;
type RemovalEventEmitterRegistry = {
    registerRouteEmitter: (routeKey: string, emitter: RemovalEventEmitter) => void;
    unregisterRouteEmitter: (routeKey: string, emitter: RemovalEventEmitter) => void;
    emitRemovalEvent: (routeKey: string, type: RemovalEventType, action: NavigationAction) => void;
};
/** Provides the route keys that currently prevent removal across the navigation tree. */
export declare const GlobalRoutesWithRemovalPreventedContext: React.Context<ReadonlySet<string> | undefined>;
/** Registers route emitters and delivers their post-commit removal events. */
export declare const GlobalRemovalEventEmitterRegistryContext: React.Context<RemovalEventEmitterRegistry | null>;
/** Registers independent prevention requests with the nearest route provider. */
export declare const ScreenRemovalPreventionSetterContext: React.Context<((id: string, isPrevented: boolean, preventInPreloadedRoutes?: boolean) => void) | undefined>;
/** Owns the global prevented-route list and route removal-event registry. */
export declare function RemovalPreventionProvider({ children }: PropsWithChildren): React.JSX.Element;
/** Binds prevention requests and removal events to one route. */
export declare function PreventRemovalProvider({ routeKey, emitRemovalEvent, children, }: PropsWithChildren<{
    routeKey: string;
    emitRemovalEvent?: RouteRemovalEventEmitter;
}>): React.JSX.Element;
export declare function useRoutesWithRemovalPrevented(): ReadonlySet<string>;
export {};
