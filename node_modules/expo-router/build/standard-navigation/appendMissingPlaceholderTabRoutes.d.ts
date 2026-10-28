import type { NavigationState } from '../react-navigation/native';
import type { DescribePlaceholderRoute, PlaceholderDescriptorMap } from './types';
export declare function appendMissingPlaceholderTabDescriptors<State extends NavigationState, NavigatorOptions extends object>(descriptors: PlaceholderDescriptorMap<NavigatorOptions>, state: State, describe: DescribePlaceholderRoute<NavigatorOptions>): PlaceholderDescriptorMap<NavigatorOptions>;
export declare function appendMissingPlaceholderTabRoutes<State extends NavigationState, NavigatorOptions extends object>(state: State, descriptors: PlaceholderDescriptorMap<NavigatorOptions>): State;
