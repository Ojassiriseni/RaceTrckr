'use strict';

import { Blob } from "./Blob.js";
import { toArrayBuffer } from "./bytes.js";
import { DOMException } from "./DOMException.js";
import { EventTargetLite } from "./events.js";
import { FormData } from "./FormData.js";
import { combineHeader, extractCharset, getHeader, hasHeader, isForbiddenMethod, isForbiddenRequestHeader, isHeaderName, isHeaderValue, isSupportedRequestUrl, isToken, normalizeHeaderValue, normalizeMethod, sortAndCombineHeaders } from "./http.js";
import { stripUtf8Bom, utf8Decode, utf8Encode } from "./utf8.js";
const UNSENT = 0;
const OPENED = 1;
const HEADERS_RECEIVED = 2;
const LOADING = 3;
const DONE = 4;
const RESPONSE_TYPES = ['', 'text', 'arraybuffer', 'blob', 'json'];
class XMLHttpRequestUpload extends EventTargetLite {}
export class XMLHttpRequest extends EventTargetLite {
  static UNSENT = UNSENT;
  static OPENED = OPENED;
  static HEADERS_RECEIVED = HEADERS_RECEIVED;
  static LOADING = LOADING;
  static DONE = DONE;
  UNSENT = UNSENT;
  OPENED = OPENED;
  HEADERS_RECEIVED = HEADERS_RECEIVED;
  LOADING = LOADING;
  DONE = DONE;
  readyState = UNSENT;
  status = 0;
  statusText = '';
  responseURL = '';
  timeout = 0;
  /**
   * The specification defaults this to `false`. React Native's own
   * `XMLHttpRequest` defaults it to `true`, and Worklet Runtimes share the
   * app's cookie storage, so the parity is deliberate.
   */
  withCredentials = true;
  upload = new XMLHttpRequestUpload();
  onreadystatechange = null;
  onloadstart = null;
  onprogress = null;
  onload = null;
  onloadend = null;
  onerror = null;
  ontimeout = null;
  onabort = null;
  requestId = null;
  requestToken = 0;
  method = 'GET';
  url = '';
  sent = false;
  hasRequestBody = false;
  requestBodyLength = 0;
  uploadSettled = false;
  downloadedBytes = 0;
  mimeTypeOverride = null;
  requestHeaders = [];
  responseHeaders = [];
  responseTypeValue = '';
  responseBytes = null;
  responseBlobValue = null;
  responseTextValue = null;
  responseJsonValue = undefined;
  get responseType() {
    return this.responseTypeValue;
  }
  set responseType(value) {
    if (this.readyState >= LOADING) {
      throw new DOMException("[Worklets] Failed to set 'responseType' on 'XMLHttpRequest': the response type cannot be changed once loading has started.", 'InvalidStateError');
    }
    if (!RESPONSE_TYPES.includes(value)) {
      return;
    }
    this.responseTypeValue = value;
  }
  get response() {
    switch (this.responseTypeValue) {
      case '':
      case 'text':
        return this.readyState >= LOADING ? this.getResponseText() : '';
      case 'arraybuffer':
        return this.readyState === DONE ? this.responseBytes : null;
      case 'blob':
        if (this.readyState !== DONE || this.responseBytes === null) {
          return null;
        }
        if (this.responseBlobValue === null) {
          this.responseBlobValue = new Blob([this.responseBytes], {
            type: this.mimeTypeOverride ?? this.getResponseHeader('content-type') ?? ''
          });
        }
        return this.responseBlobValue;
      case 'json':
        if (this.readyState !== DONE) {
          return null;
        }
        if (this.responseJsonValue === undefined) {
          try {
            this.responseJsonValue = JSON.parse(this.responseBytes === null ? '' : utf8Decode(stripUtf8Bom(new Uint8Array(this.responseBytes))));
          } catch {
            this.responseJsonValue = null;
          }
        }
        return this.responseJsonValue;
      default:
        return null;
    }
  }
  get responseText() {
    if (this.responseTypeValue !== '' && this.responseTypeValue !== 'text') {
      throw new DOMException("[Worklets] Failed to read 'responseText' on 'XMLHttpRequest': the value is only accessible if the object's 'responseType' is '' or 'text'.", 'InvalidStateError');
    }
    return this.readyState >= LOADING ? this.getResponseText() : '';
  }
  open(method, url, async = true) {
    const methodValue = String(method);
    const urlValue = String(url);
    if (!isToken(methodValue)) {
      throw new DOMException(`[Worklets] Failed to execute 'open' on 'XMLHttpRequest': '${methodValue}' is not a valid HTTP method.`, 'SyntaxError');
    }
    if (isForbiddenMethod(methodValue)) {
      throw new DOMException(`[Worklets] Failed to execute 'open' on 'XMLHttpRequest': '${methodValue}' HTTP method is unsupported.`, 'SecurityError');
    }
    if (urlValue === '') {
      throw new DOMException("[Worklets] Failed to execute 'open' on 'XMLHttpRequest': the URL cannot be empty.", 'SyntaxError');
    }
    if (!async) {
      throw new DOMException('[Worklets] Synchronous XMLHttpRequest is not supported.', 'InvalidAccessError');
    }
    this.terminate();
    this.method = normalizeMethod(methodValue);
    this.url = urlValue;
    this.sent = false;
    this.hasRequestBody = false;
    this.requestBodyLength = 0;
    this.uploadSettled = false;
    this.mimeTypeOverride = null;
    this.requestHeaders = [];
    this.resetResponse();
    if (this.readyState !== OPENED) {
      this.setReadyState(OPENED);
    } else {
      this.readyState = OPENED;
    }
  }
  setRequestHeader(name, value) {
    if (this.readyState !== OPENED || this.sent) {
      throw new DOMException("[Worklets] Failed to execute 'setRequestHeader' on 'XMLHttpRequest': the object's state must be OPENED.", 'InvalidStateError');
    }
    const nameValue = String(name);
    const headerValue = normalizeHeaderValue(String(value));
    if (!isHeaderName(nameValue) || !isHeaderValue(headerValue)) {
      throw new DOMException(`[Worklets] Failed to execute 'setRequestHeader' on 'XMLHttpRequest': '${nameValue}: ${headerValue}' is not a valid header.`, 'SyntaxError');
    }
    if (isForbiddenRequestHeader(nameValue, headerValue)) {
      return;
    }
    combineHeader(this.requestHeaders, nameValue, headerValue);
  }
  getAllResponseHeaders() {
    return sortAndCombineHeaders(this.responseHeaders);
  }
  getResponseHeader(name) {
    return getHeader(this.responseHeaders, String(name));
  }
  overrideMimeType(mimeType) {
    if (this.readyState >= LOADING) {
      throw new DOMException("[Worklets] Failed to execute 'overrideMimeType' on 'XMLHttpRequest': the MIME type cannot be overridden once loading has started.", 'InvalidStateError');
    }
    this.mimeTypeOverride = String(mimeType);
    this.responseTextValue = null;
  }
  send(body) {
    const networking = globalThis.__workletsNetworking;
    if (networking === undefined) {
      throw new DOMException('[Worklets] XMLHttpRequest is not available on this runtime.', 'InvalidStateError');
    }
    if (this.readyState !== OPENED || this.sent) {
      throw new DOMException("[Worklets] Failed to execute 'send' on 'XMLHttpRequest': the object's state must be OPENED.", 'InvalidStateError');
    }
    this.sent = true;
    if (!isSupportedRequestUrl(this.url)) {
      this.__dispatch('loadstart');
      setTimeout(() => this.handleRequestError('network', `Only http and https URLs are supported, got '${this.url}'.`));
      return;
    }
    const {
      data,
      contentType
    } = this.method === 'GET' || this.method === 'HEAD' ? {
      data: undefined,
      contentType: undefined
    } : normalizeBody(body);
    const headers = [...this.requestHeaders];
    if (contentType !== undefined && !hasHeader(headers, 'content-type')) {
      headers.push(['Content-Type', contentType]);
    }
    this.hasRequestBody = data !== undefined;
    this.requestBodyLength = typeof data === 'string' ? utf8Encode(data).length : data?.byteLength ?? 0;
    const token = ++this.requestToken;
    this.requestId = networking.sendRequest({
      method: this.method,
      url: this.url,
      headers,
      body: data,
      timeoutMs: this.timeout,
      withCredentials: this.withCredentials
    }, (type, payload) => {
      if (token === this.requestToken && this.requestId !== null) {
        this.handleNetworkingEvent(type, payload);
      }
    });
    this.__dispatch('loadstart');
    if (this.hasRequestBody) {
      this.upload.__dispatch('loadstart', {
        loaded: 0,
        total: this.requestBodyLength,
        lengthComputable: this.requestBodyLength > 0
      });
    }
  }
  abort() {
    const wasInFlight = this.terminate();
    if (this.readyState === OPENED && !this.sent) {
      return;
    }
    if (!wasInFlight || this.readyState === UNSENT) {
      this.readyState = UNSENT;
      return;
    }
    if (this.readyState === DONE) {
      this.resetResponse();
      this.readyState = UNSENT;
      return;
    }
    this.resetResponse();
    this.setReadyState(DONE);
    this.settleUploadWithError('abort');
    this.__dispatch('abort');
    this.__dispatch('loadend');
    if (this.readyState === DONE) {
      this.readyState = UNSENT;
    }
  }
  handleNetworkingEvent(type, payload) {
    switch (type) {
      case 'response':
        {
          const {
            status,
            statusText,
            headers,
            url
          } = payload;
          this.status = status;
          this.statusText = statusText;
          this.responseHeaders = headers;
          this.responseURL = url;
          this.settleUploadWithSuccess();
          this.setReadyState(HEADERS_RECEIVED);
          break;
        }
      case 'downloadProgress':
        {
          const {
            loaded,
            total
          } = payload;
          this.downloadedBytes = loaded;
          if (this.readyState === HEADERS_RECEIVED) {
            this.setReadyState(LOADING);
          } else {
            this.__dispatch('readystatechange');
          }
          this.__dispatch('progress', {
            loaded,
            total: total > 0 ? total : 0,
            lengthComputable: total > 0
          });
          break;
        }
      case 'uploadProgress':
        {
          const {
            loaded,
            total
          } = payload;
          this.upload.__dispatch('progress', {
            loaded,
            total: total > 0 ? total : 0,
            lengthComputable: total > 0
          });
          break;
        }
      case 'done':
        {
          this.requestId = null;
          const {
            body,
            error,
            message
          } = payload;
          if (error !== undefined) {
            this.handleRequestError(error, message);
          } else if (this.status === 0) {
            this.handleRequestError('network', 'The request completed without a response.');
          } else {
            this.handleResponseEndOfBody(body);
          }
          break;
        }
    }
  }
  handleRequestError(error, message) {
    const terminalEvent = error === 'timeout' ? 'timeout' : error === 'aborted' ? 'abort' : 'error';
    this.resetResponse();
    this.setReadyState(DONE);
    this.settleUploadWithError(terminalEvent);
    this.__dispatch(terminalEvent, {
      message
    });
    this.__dispatch('loadend');
  }
  handleResponseEndOfBody(body) {
    this.responseBytes = body ?? new ArrayBuffer(0);
    this.responseTextValue = null;
    this.responseBlobValue = null;
    this.responseJsonValue = undefined;
    const transmitted = Math.max(this.responseBytes.byteLength, this.downloadedBytes);
    const rawContentLength = this.getResponseHeader('content-length');
    const contentLength = rawContentLength === null ? Number.NaN : Number(rawContentLength);
    const total = Number.isInteger(contentLength) && contentLength > 0 ? contentLength : 0;
    const progress = {
      loaded: transmitted,
      total,
      lengthComputable: total > 0
    };
    this.settleUploadWithSuccess();
    this.__dispatch('progress', progress);
    this.setReadyState(DONE);
    this.__dispatch('load', progress);
    this.__dispatch('loadend', progress);
  }
  settleUploadWithSuccess() {
    if (!this.hasRequestBody || this.uploadSettled) {
      return;
    }
    this.uploadSettled = true;
    const progress = {
      loaded: this.requestBodyLength,
      total: this.requestBodyLength,
      lengthComputable: this.requestBodyLength > 0
    };
    this.upload.__dispatch('progress', progress);
    this.upload.__dispatch('load', progress);
    this.upload.__dispatch('loadend', progress);
  }
  settleUploadWithError(type) {
    if (!this.hasRequestBody || this.uploadSettled) {
      return;
    }
    this.uploadSettled = true;
    this.upload.__dispatch(type);
    this.upload.__dispatch('loadend');
  }
  getResponseText() {
    if (this.responseTextValue === null) {
      this.responseTextValue = decodeResponseText(this.responseBytes, extractCharset(this.mimeTypeOverride) ?? extractCharset(this.getResponseHeader('content-type')));
    }
    return this.responseTextValue;
  }
  resetResponse() {
    this.status = 0;
    this.statusText = '';
    this.responseURL = '';
    this.downloadedBytes = 0;
    this.responseHeaders = [];
    this.responseBytes = null;
    this.responseTextValue = null;
    this.responseBlobValue = null;
    this.responseJsonValue = undefined;
  }
  terminate() {
    if (this.requestId === null) {
      return this.sent;
    }
    globalThis.__workletsNetworking?.abortRequest(this.requestId);
    this.requestId = null;
    return true;
  }
  setReadyState(readyState) {
    this.readyState = readyState;
    this.__dispatch('readystatechange');
  }
}
function decodeResponseText(bytes, charset) {
  if (bytes === null || bytes.byteLength === 0) {
    return '';
  }
  const networking = globalThis.__workletsNetworking;
  if (networking !== undefined) {
    return networking.decodeText(bytes, charset);
  }
  return utf8Decode(new Uint8Array(bytes));
}
function isBlobLike(body) {
  return typeof body?.__getBytes === 'function';
}
function normalizeBody(body) {
  if (body === null || body === undefined) {
    return {};
  }
  if (typeof body === 'string') {
    return {
      data: body,
      contentType: 'text/plain;charset=UTF-8'
    };
  }
  if (body instanceof ArrayBuffer) {
    return {
      data: body
    };
  }
  if (isBlobLike(body)) {
    return {
      data: toArrayBuffer(body.__getBytes()),
      contentType: body.type !== '' ? body.type : undefined
    };
  }
  if (body instanceof FormData) {
    const {
      body: data,
      contentType
    } = body.__encodeMultipart();
    return {
      data,
      contentType
    };
  }
  if (ArrayBuffer.isView(body)) {
    return {
      data: toArrayBuffer(new Uint8Array(body.buffer, body.byteOffset, body.byteLength))
    };
  }
  return {
    data: String(body)
  };
}
//# sourceMappingURL=XMLHttpRequest.js.map