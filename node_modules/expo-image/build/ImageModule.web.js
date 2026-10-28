import { NativeModule, registerWebModule } from 'expo';
import ImageRefWeb from './web/ImageRef';
class ImageModule extends NativeModule {
    Image = ImageRefWeb;
    async prefetch(urls, _, __) {
        const urlsArray = Array.isArray(urls) ? urls : [
            urls
        ];
        return new Promise((resolve)=>{
            let imagesLoaded = 0;
            urlsArray.forEach((url)=>{
                const img = new Image();
                img.src = url;
                img.onload = ()=>{
                    imagesLoaded++;
                    if (imagesLoaded === urlsArray.length) {
                        resolve(true);
                    }
                };
                img.onerror = ()=>resolve(false);
            });
        });
    }
    async clearMemoryCache() {
        return false;
    }
    async clearDiskCache() {
        return false;
    }
    configureCache(_) {}
    async loadAsync(source) {
        if (!source.uri) {
            // TODO: Add support for sources without the uri, e.g. blurhash and thumbhash.
            throw new Error('The image source must have the "uri" property defined');
        }
        const response = await fetch(source.uri, {
            headers: source.headers
        });
        if (!response.ok) {
            throw new Error(`Image request failed with the status code: ${response.status}`);
        }
        const blob = await response.blob();
        const imageObjectUrl = URL.createObjectURL(blob);
        const image = await loadImageElementAsync(imageObjectUrl);
        return ImageRefWeb.init(imageObjectUrl, image.width, image.height, response.headers.get('Content-Type'));
    }
    getCachePathAsync(_) {
        return Promise.resolve(null);
    }
    writeToCacheAsync(_, __) {
        throw new Error('Writing to the cache is not supported on Web.');
    }
    readFromCacheAsync(_) {
        return Promise.resolve(null);
    }
    generateBlurhashAsync(_, __) {
        throw new Error('Blurhash generation is not supported on Web.');
    }
    generateThumbhashAsync(_) {
        throw new Error('Thumbhash generation is not supported on Web.');
    }
}
/**
 * Helper that resolves to an `<img />` element once it finishes loading the given source.
 */ async function loadImageElementAsync(src) {
    return new Promise((resolve, reject)=>{
        const image = document.createElement('img');
        image.onload = ()=>resolve(image);
        image.onerror = ()=>reject(new Error(`Unable to load the image from '${src}'`));
        image.src = src;
    });
}
export default registerWebModule(ImageModule, 'ExpoImage');

//# sourceMappingURL=ImageModule.web.js.map
