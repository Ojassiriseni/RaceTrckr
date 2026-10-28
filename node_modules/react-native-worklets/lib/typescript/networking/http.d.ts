export declare function normalizeMethod(method: string): string;
export declare function isToken(value: string): boolean;
export declare function isForbiddenMethod(method: string): boolean;
export declare function isSupportedRequestUrl(url: string): boolean;
export declare function isHeaderName(name: string): boolean;
export declare function isHeaderValue(value: string): boolean;
export declare function normalizeHeaderValue(value: string): string;
export declare function isForbiddenRequestHeader(name: string, value: string): boolean;
export declare function combineHeader(headers: Array<[string, string]>, name: string, value: string): void;
export declare function hasHeader(headers: Array<[string, string]>, name: string): boolean;
export declare function getHeader(headers: Array<[string, string]>, name: string): string | null;
export declare function sortAndCombineHeaders(headers: Array<[string, string]>): string;
export declare function extractCharset(mimeType: string | null): string | undefined;
//# sourceMappingURL=http.d.ts.map