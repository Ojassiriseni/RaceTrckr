import type { ViewStyle } from 'react-native';
import type { ValueProcessor } from '../../types';
import type { ProcessedColor } from './colors';
type BackgroundImageStyleValue = NonNullable<ViewStyle[Extract<keyof ViewStyle, 'backgroundImage' | 'experimental_backgroundImage'>]>;
type BackgroundImageValue = Exclude<BackgroundImageStyleValue, string>[number];
type RadialGradientValue = Extract<BackgroundImageValue, {
    type: 'radial-gradient';
}>;
type RadialGradientShape = RadialGradientValue['shape'];
type RadialGradientSize = RadialGradientValue['size'];
type RadialGradientPosition = RadialGradientValue['position'];
export declare const ERROR_MESSAGES: {
    invalidDirection(direction: string): string;
    invalidPosition(position: unknown): string;
    invalidShape(shape: string): string;
    invalidSize(size: unknown): string;
    invalidTransitionHint(position: unknown): string;
    notEnoughColorStops(count: number): string;
};
export type ProcessedDirection = {
    type: 'angle';
    value: number;
} | {
    type: 'keyword';
    value: string;
};
export type ProcessedColorStop = {
    color: ProcessedColor | null;
    position: number | string | null;
};
export type ProcessedBackgroundImageValue = {
    type: 'linear-gradient';
    direction: ProcessedDirection;
    colorStops: ProcessedColorStop[];
} | {
    type: 'radial-gradient';
    shape: RadialGradientShape;
    size: RadialGradientSize;
    position: RadialGradientPosition;
    colorStops: ProcessedColorStop[];
};
export declare const processBackgroundImage: ValueProcessor<BackgroundImageStyleValue, ProcessedBackgroundImageValue[] | undefined>;
export {};
//# sourceMappingURL=backgroundImage.d.ts.map