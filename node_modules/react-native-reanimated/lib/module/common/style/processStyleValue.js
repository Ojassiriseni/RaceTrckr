'use strict';

export function processStyleValue(processor, value, context) {
  'worklet';

  // CSS strips whitespace around a declaration value, so processors can
  // assume they are given a trimmed string.
  const normalizedValue = typeof value === 'string' ? value.trim() : value;
  return processor(normalizedValue, context);
}
//# sourceMappingURL=processStyleValue.js.map