export declare class FormData {
    private formEntries;
    get [Symbol.toStringTag](): string;
    append(name: string, value: unknown): void;
    set(name: string, value: unknown): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    delete(name: string): void;
    forEach(callback: (value: string, name: string, formData: FormData) => void): void;
    entries(): IterableIterator<[string, string]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    [Symbol.iterator](): IterableIterator<[string, string]>;
    /**
     * Mirrors React Native's non-standard `FormData.getParts`. Its presence makes
     * libraries like Axios treat this object as a React Native `FormData` and
     * leave the multipart encoding to `XMLHttpRequest`.
     */
    getParts(): Array<{
        string: string;
        fieldName: string;
        headers: Record<string, string>;
    }>;
    __encodeMultipart(): {
        body: ArrayBuffer;
        contentType: string;
    };
}
//# sourceMappingURL=FormData.d.ts.map