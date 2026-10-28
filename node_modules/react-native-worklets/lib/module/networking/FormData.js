'use strict';

import { toArrayBuffer } from "./bytes.js";
import { utf8Encode } from "./utf8.js";
export class FormData {
  formEntries = [];
  get [Symbol.toStringTag]() {
    return 'FormData';
  }
  append(name, value) {
    if (value !== null && typeof value === 'object') {
      throw new TypeError("[Worklets] Failed to execute 'append' on 'FormData': only string values are supported.");
    }
    this.formEntries.push([String(name), String(value)]);
  }
  set(name, value) {
    this.delete(name);
    this.append(name, value);
  }
  get(name) {
    const entry = this.formEntries.find(([entryName]) => entryName === String(name));
    return entry !== undefined ? entry[1] : null;
  }
  getAll(name) {
    return this.formEntries.filter(([entryName]) => entryName === String(name)).map(([, value]) => value);
  }
  has(name) {
    return this.formEntries.some(([entryName]) => entryName === String(name));
  }
  delete(name) {
    this.formEntries = this.formEntries.filter(([entryName]) => entryName !== String(name));
  }
  forEach(callback) {
    for (const [name, value] of this.formEntries) {
      callback(value, name, this);
    }
  }
  *entries() {
    for (const [name, value] of this.formEntries) {
      yield [name, value];
    }
  }
  *keys() {
    for (const [name] of this.formEntries) {
      yield name;
    }
  }
  *values() {
    for (const [, value] of this.formEntries) {
      yield value;
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }

  /**
   * Mirrors React Native's non-standard `FormData.getParts`. Its presence makes
   * libraries like Axios treat this object as a React Native `FormData` and
   * leave the multipart encoding to `XMLHttpRequest`.
   */
  getParts() {
    return this.formEntries.map(([name, value]) => ({
      string: value,
      fieldName: name,
      headers: {
        'content-disposition': `form-data; name="${escapeName(name)}"`
      }
    }));
  }
  __encodeMultipart() {
    const parts = this.formEntries.map(([name, value]) => `content-disposition: form-data; name="${escapeName(name)}"\r\n\r\n${value}`);
    const boundary = pickBoundary(parts);
    let encoded = '';
    for (const part of parts) {
      encoded += `--${boundary}\r\n${part}\r\n`;
    }
    encoded += `--${boundary}--\r\n`;
    return {
      body: toArrayBuffer(utf8Encode(encoded)),
      contentType: `multipart/form-data; boundary=${boundary}`
    };
  }
}

/**
 * Picks a boundary that appears in none of the parts. Entry values are written
 * verbatim, so a value that contained the boundary could otherwise inject
 * arbitrary parts into the request.
 */
function pickBoundary(parts) {
  for (;;) {
    const boundary = `----WorkletsFormDataBoundary${randomToken()}${randomToken()}`;
    if (!parts.some(part => part.includes(boundary))) {
      return boundary;
    }
  }
}
function randomToken() {
  return Math.random().toString(36).slice(2).padEnd(11, '0');
}
function escapeName(name) {
  return name.replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/"/g, '%22');
}
//# sourceMappingURL=FormData.js.map