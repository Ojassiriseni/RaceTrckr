type BlobPart = string | ArrayBuffer | ArrayBufferView | Blob;
export declare class Blob {
    readonly type: string;
    private bytes;
    constructor(parts?: BlobPart[], options?: {
        type?: string;
    });
    get size(): number;
    get [Symbol.toStringTag](): string;
    slice(start?: number, end?: number, contentType?: string): Blob;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    __getBytes(): Uint8Array;
}
export {};
//# sourceMappingURL=Blob.d.ts.map