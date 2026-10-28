import { SharedRef } from 'expo';
export default class ImageRefWeb extends SharedRef {
    nativeRefType = 'image';
    uri = null;
    width = 0;
    height = 0;
    mediaType = null;
    scale = 1;
    isAnimated = false;
    static init(uri, width, height, mediaType) {
        return Object.assign(new ImageRefWeb(), {
            uri,
            width,
            height,
            mediaType,
            isAnimated: mediaType === 'image/gif'
        });
    }
}

//# sourceMappingURL=ImageRef.js.map
