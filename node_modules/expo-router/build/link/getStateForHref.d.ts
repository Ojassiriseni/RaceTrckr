import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { UrlObject } from '../global-state/getRouteInfoFromState';
import type { LinkToOptions } from '../global-state/types';
import type { Href } from '../types';
export declare function getStateForHref(href: Href | string, routeInfo: Pick<UrlObject, 'segments'>, linking: ExpoLinkingOptions | undefined, options?: LinkToOptions): import("..").ResultState | undefined;
