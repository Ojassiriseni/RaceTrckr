import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { StoreRedirects } from './types';
export type RouterConfig = {
    routeNode: RouteNode | null;
    linking: ExpoLinkingOptions | undefined;
    redirects: StoreRedirects[];
};
export declare const RouterConfigContext: import("react").Context<RouterConfig | null>;
