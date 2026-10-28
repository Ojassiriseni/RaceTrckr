import type { ComponentType, ReactNode } from 'react';
import * as ScreensExperimental from 'react-native-screens/experimental';
export declare const StackV5: {
    Host: typeof import("react-native-screens/lib/typescript/components/gamma/stack/host").StackHost;
    Screen: typeof import("react-native-screens/lib/typescript/components/gamma/stack/screen").StackScreen;
    HeaderConfig: import("react").ForwardRefExoticComponent<import("react-native-screens/lib/typescript/components/gamma/stack/header").StackHeaderConfigProps & import("react").RefAttributes<import("react-native-screens/lib/typescript/components/gamma/stack/header").StackHeaderConfigRef>>;
};
type SplitV5Components = {
    Stack?: ComponentType<{
        children?: ReactNode;
    }>;
    HeaderConfig?: ComponentType<object>;
};
export declare const Split: typeof ScreensExperimental.Split & SplitV5Components;
export type { SplitHostProps } from 'react-native-screens/experimental';
