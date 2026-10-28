import type { JSX } from 'react';
type Render = (children: React.ReactNode) => JSX.Element;
export declare function useComponent(render: Render): ({ children }: {
    children: React.ReactNode;
}) => JSX.Element;
export {};
