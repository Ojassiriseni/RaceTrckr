import type { FixedSynchronizable, ShareableHost } from 'react-native-worklets';
import type { Mutable } from './commonTypes';
export declare function checkInvalidReadDuringRender(): void;
export declare function checkInvalidWriteDuringRender(): void;
export type Listener<TValue> = (newValue: TValue) => void;
export declare function mutableHostDecorator<TValue>(mutable: ShareableHost<TValue> & Mutable<TValue>, dirtyFlag?: FixedSynchronizable<boolean>): ShareableHost<TValue> & Mutable<TValue>;
//# sourceMappingURL=mutablesCommon.d.ts.map