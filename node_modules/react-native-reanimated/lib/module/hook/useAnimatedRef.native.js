'use strict';

import { useState } from 'react';
import { createSerializable, createShareable, scheduleOnUI, serializableMappingCache, UIRuntimeId } from 'react-native-worklets';
import { getShadowNodeWrapperFromRef } from '../fabricUtils';
import { useAnimatedRefBase } from "./useAnimatedRefCommon.js";

/**
 * Lets you get a reference of a view that you can use inside a worklet.
 *
 * @returns An object with a `.current` property which contains an instance of
 *   the reference object.
 * @see https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedRef
 */
export function useAnimatedRef() {
  const [sharedWrapper] = useState(() => createShareable(UIRuntimeId, null));
  const resultRef = useAnimatedRefBase(ref => {
    const currentWrapper = getShadowNodeWrapperFromRef(ref);
    scheduleOnUI(() => {
      sharedWrapper.value = currentWrapper;
    });
    return currentWrapper;
  });
  if (!serializableMappingCache.get(resultRef)) {
    const animatedRefSerializable = createSerializable(sharedWrapper);
    serializableMappingCache.set(resultRef, animatedRefSerializable);
  }
  return resultRef;
}
//# sourceMappingURL=useAnimatedRef.native.js.map