import { type ReactNode } from 'react';
export declare function NavigationActivityProvider({ activityThreshold, children, }: {
    activityThreshold: number | undefined;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useActivityThreshold(): number | undefined;
