'use strict';

import { toArrayBuffer } from "./bytes.js";
import { stripUtf8Bom, utf8Decode, utf8Encode } from "./utf8.js";
export class Blob {
  constructor(parts = [], options = {}) {
    const chunks = parts.map(toUint8Array);
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const bytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    this.bytes = bytes;
    this.type = String(options.type ?? '').toLowerCase();
  }
  get size() {
    return this.bytes.byteLength;
  }
  get [Symbol.toStringTag]() {
    return 'Blob';
  }
  slice(start = 0, end = this.size, contentType = '') {
    const size = this.size;
    const relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    const relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const blob = new Blob([], {
      type: contentType
    });
    blob.bytes = this.bytes.slice(relativeStart, relativeStart + span);
    return blob;
  }
  arrayBuffer() {
    return Promise.resolve(toArrayBuffer(this.bytes));
  }
  text() {
    return Promise.resolve(utf8Decode(stripUtf8Bom(this.bytes)));
  }
  __getBytes() {
    return this.bytes;
  }
}
function toUint8Array(part) {
  if (typeof part === 'string') {
    return utf8Encode(part);
  }
  if (part instanceof Blob) {
    return part.__getBytes();
  }
  if (ArrayBuffer.isView(part)) {
    return new Uint8Array(part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength));
  }
  if (part instanceof ArrayBuffer) {
    return new Uint8Array(part.slice(0));
  }
  return utf8Encode(String(part));
}
//# sourceMappingURL=Blob.js.map