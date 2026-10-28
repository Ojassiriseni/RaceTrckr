import { getPathFromState } from '../fork/getPathFromState';
import { getStateFromPath } from '../fork/getStateFromPath';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { NavigationState } from '../react-navigation/routers';
export type PathLinking = Pick<ExpoLinkingOptions, 'config' | 'getPathFromState' | 'getStateFromPath'>;
/** The linking functions with the router defaults for anything the config leaves out. */
export declare function resolvePathLinking(linking: PathLinking | undefined): {
    getStateFromPath: typeof getStateFromPath;
    getPathFromState: typeof getPathFromState;
};
/** The browser path for a navigation state. */
export declare function getPathForState(state: NavigationState, linking: PathLinking | undefined): string;
