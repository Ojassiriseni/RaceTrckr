import type { Href } from '../../types';
import type { PreviewActivationRoute } from './native';
export declare function usePreviewActivationPath(): [
    PreviewActivationRoute[] | undefined,
    (href: Href) => void,
    () => void
];
