'use strict';

import { AbortController, AbortSignal } from "./AbortController.js";
import { Blob } from "./Blob.js";
import { DOMException } from "./DOMException.js";
import { FileReader } from "./FileReader.js";
import { FormData } from "./FormData.js";
import { XMLHttpRequest } from "./XMLHttpRequest.js";

/**
 * Installs the networking API (`fetch`, `XMLHttpRequest` and their supporting
 * globals) on a Worklet Runtime. The native `__workletsNetworking` binding is
 * installed by C++ only on Worklet Runtimes in Bundle Mode, so this function is
 * a no-op anywhere else.
 *
 * All polyfills must be in place before `whatwg-fetch` is required because it
 * feature-detects them at module scope.
 */
let installed = false;
export function installNetworking() {
  if (globalThis.__workletsNetworking === undefined || installed) {
    return;
  }
  installed = true;
  const global = globalThis;
  global.XMLHttpRequest ??= XMLHttpRequest;
  global.Blob ??= Blob;
  global.FileReader ??= FileReader;
  global.FormData ??= FormData;
  global.DOMException ??= DOMException;
  global.AbortController ??= AbortController;
  global.AbortSignal ??= AbortSignal;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('whatwg-fetch');
}
//# sourceMappingURL=install.js.map