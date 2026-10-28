import type { NetworkingEventListener } from './events';
import { EventTargetLite } from './events';
declare const RESPONSE_TYPES: readonly ["", "text", "arraybuffer", "blob", "json"];
type XMLHttpRequestResponseType = (typeof RESPONSE_TYPES)[number];
declare class XMLHttpRequestUpload extends EventTargetLite {
}
export declare class XMLHttpRequest extends EventTargetLite {
    static readonly UNSENT = 0;
    static readonly OPENED = 1;
    static readonly HEADERS_RECEIVED = 2;
    static readonly LOADING = 3;
    static readonly DONE = 4;
    readonly UNSENT = 0;
    readonly OPENED = 1;
    readonly HEADERS_RECEIVED = 2;
    readonly LOADING = 3;
    readonly DONE = 4;
    readyState: number;
    status: number;
    statusText: string;
    responseURL: string;
    timeout: number;
    /**
     * The specification defaults this to `false`. React Native's own
     * `XMLHttpRequest` defaults it to `true`, and Worklet Runtimes share the
     * app's cookie storage, so the parity is deliberate.
     */
    withCredentials: boolean;
    readonly upload: XMLHttpRequestUpload;
    onreadystatechange: NetworkingEventListener | null;
    onloadstart: NetworkingEventListener | null;
    onprogress: NetworkingEventListener | null;
    onload: NetworkingEventListener | null;
    onloadend: NetworkingEventListener | null;
    onerror: NetworkingEventListener | null;
    ontimeout: NetworkingEventListener | null;
    onabort: NetworkingEventListener | null;
    private requestId;
    private requestToken;
    private method;
    private url;
    private sent;
    private hasRequestBody;
    private requestBodyLength;
    private uploadSettled;
    private downloadedBytes;
    private mimeTypeOverride;
    private requestHeaders;
    private responseHeaders;
    private responseTypeValue;
    private responseBytes;
    private responseBlobValue;
    private responseTextValue;
    private responseJsonValue;
    get responseType(): XMLHttpRequestResponseType;
    set responseType(value: XMLHttpRequestResponseType);
    get response(): unknown;
    get responseText(): string;
    open(method: string, url: string, async?: boolean): void;
    setRequestHeader(name: string, value: string): void;
    getAllResponseHeaders(): string;
    getResponseHeader(name: string): string | null;
    overrideMimeType(mimeType: string): void;
    send(body?: unknown): void;
    abort(): void;
    private handleNetworkingEvent;
    private handleRequestError;
    private handleResponseEndOfBody;
    private settleUploadWithSuccess;
    private settleUploadWithError;
    private getResponseText;
    private resetResponse;
    private terminate;
    private setReadyState;
}
export {};
//# sourceMappingURL=XMLHttpRequest.d.ts.map