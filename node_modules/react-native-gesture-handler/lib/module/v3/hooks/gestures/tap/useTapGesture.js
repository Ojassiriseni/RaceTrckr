"use strict";

import { SingleGestureName } from '../../../types';
import { useGesture } from '../../useGesture';
import { useClonedAndRemappedConfig } from '../../utils';
const TapPropsMapping = new Map([['maxDistance', 'maxDist'], ['maxDuration', 'maxDurationMs'], ['maxDelay', 'maxDelayMs']]);
function transformTapProps(config) {
  if (config.shouldCancelWhenOutside === undefined) {
    config.shouldCancelWhenOutside = true;
  }
  return config;
}
const EMPTY_TAP_CONFIG = {};
export function useTapGesture(config = EMPTY_TAP_CONFIG) {
  const tapConfig = useClonedAndRemappedConfig(config, TapPropsMapping, transformTapProps);
  return useGesture(SingleGestureName.Tap, tapConfig);
}
//# sourceMappingURL=useTapGesture.js.map