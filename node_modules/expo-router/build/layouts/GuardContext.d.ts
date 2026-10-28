import { type ReactNode } from 'react';
import type { RouteNode } from '../Route';
import type { Href } from '../types';
export type GuardedRedirects = Map<string, Href | undefined>;
export type GuardRedirect = Href | null;
export type ResolvedGuards = Map<string, GuardRedirect>;
export declare const GuardContext: import("react").Context<ResolvedGuards | null>;
export declare function GuardContextProvider({ node, guardedRedirects, children, }: {
    node: RouteNode | null;
    guardedRedirects: GuardedRedirects;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useGuardRedirect(routeName: string): GuardRedirect | undefined;
export declare function normalizeRouteName(routeName: string): string;
export declare function isRouteGuarded(routeName: string, guards: ReadonlyMap<string, unknown>): boolean;
