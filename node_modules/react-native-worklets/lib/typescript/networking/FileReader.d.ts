import type { Blob } from './Blob';
export declare class FileReader {
    static readonly EMPTY = 0;
    static readonly LOADING = 1;
    static readonly DONE = 2;
    readonly EMPTY = 0;
    readonly LOADING = 1;
    readonly DONE = 2;
    readyState: number;
    result: string | ArrayBuffer | null;
    error: unknown;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    onloadend: (() => void) | null;
    readAsArrayBuffer(blob: Blob): void;
    readAsText(blob: Blob, encoding?: string): void;
    private read;
}
//# sourceMappingURL=FileReader.d.ts.map