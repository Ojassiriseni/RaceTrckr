'use client';
import { requireOptionalNativeModule } from 'expo';
import { Dimensions, PixelRatio } from 'react-native';
const DEFAULT_OVERSIZE_THRESHOLD = 1.5;
// Guards `initObserveIntegrationIfNeeded` so repeated calls wire up the integration only once.
let initialized = false;
// Only remote images, local files, and bundled Android resources are reported: those URLs
// identify developer-owned content that the developer can act on. Every other scheme fails safe,
// because it carries device-local or user-library content (the whole payload for `data:`, a
// stable personal-photo identifier for `ph://` and `content://`).
const REPORTABLE_PROTOCOLS = new Set([
    'http:',
    'https:',
    'file:',
    'android.resource:'
]);
// Prepares a loaded image's URL for sending off-device, or returns `null` when the image must not
// be reported at all (a disallowed scheme, or a string the WHATWG parser rejects). Basic-auth
// credentials are always removed, and the query string and fragment too unless `includeUrlParams`
// opts in, so values like signing tokens or API keys never leave the device. The returned URL is
// in normalized (WHATWG) form; `sanitized` is true only when something was removed, not when
// normalization alone changed the string.
function sanitizeUrl(rawUrl, includeUrlParams) {
    let url;
    try {
        url = new URL(rawUrl);
    } catch  {
        return null;
    }
    if (!REPORTABLE_PROTOCOLS.has(url.protocol)) {
        return null;
    }
    const normalized = url.toString();
    url.username = '';
    url.password = '';
    if (!includeUrlParams) {
        url.search = '';
        url.hash = '';
    }
    const result = url.toString();
    return {
        url: result,
        sanitized: result !== normalized
    };
}
// Exported for testing purposes only.
export function reportIfOversized(state, image) {
    if (!state.enabled || !state.appMetrics) {
        return;
    }
    const { width, height, screenWidth, screenHeight, pixelRatio } = image;
    if (!image.url || !(width > 0) || !(height > 0)) {
        return;
    }
    // Screen area is in points; the decoded image is in pixels, so convert with pixelRatio² to get
    // the screen's physical pixel count.
    const budget = screenWidth * screenHeight * pixelRatio * pixelRatio;
    if (!(budget > 0) || width * height <= budget * state.threshold) {
        return;
    }
    // Sanitizing after the size check keeps the common per-load path cheap: only oversized images
    // pay for the URL parse.
    const sanitizedUrl = sanitizeUrl(image.url, state.includeUrlParams);
    if (!sanitizedUrl) {
        return;
    }
    // Deduping on the reported form also collapses variants of one image that differ only in their
    // query parameters (such as rotating signed URLs) into a single event.
    const url = sanitizedUrl.url;
    if (state.reported.has(url)) {
        return;
    }
    state.reported.add(url);
    try {
        state.appMetrics.logEvent('expo-image.oversized', {
            displayName: 'Oversized image loaded',
            severity: 'warn',
            body: `Image loaded at ${width}×${height}px is far larger than this device's screen (${screenWidth}×${screenHeight}pt @${pixelRatio}x). Constrain it with the maxWidth/maxHeight load options.`,
            attributes: {
                url,
                // True when sanitization changed the URL; WHATWG normalization alone does not count.
                urlSanitized: sanitizedUrl.sanitized,
                imageWidth: width,
                imageHeight: height,
                screenWidth,
                screenHeight,
                pixelRatio
            }
        });
    } catch  {
        console.warn('[expo-image] Failed to logEvent for oversized image.');
    // Reporting is best-effort; a logging failure must not disrupt image loading.
    }
}
// Exported for testing purposes only.
export function handleImageLoaded(state, image, report = reportIfOversized) {
    const screen = Dimensions.get('screen');
    report(state, {
        ...image,
        screenWidth: screen.width,
        screenHeight: screen.height,
        pixelRatio: PixelRatio.get()
    });
}
// Exported for testing purposes only.
export function activate(state, integrations, handle = handleImageLoaded) {
    const config = integrations['expo-image'];
    const configObject = typeof config === 'object' && config !== null ? config : {};
    state.enabled = !!config;
    state.threshold = configObject.oversizeThreshold ?? DEFAULT_OVERSIZE_THRESHOLD;
    state.includeUrlParams = configObject.includeUrlParams ?? false;
    // A new configure may change the threshold (or enable the integration), so start a fresh dedup
    // set: images already reported under the previous settings become eligible to report again.
    state.reported = new Set();
    if (state.enabled && !state.subscription && state.imageModule) {
        state.subscription = state.imageModule.addListener('imageLoaded', (image)=>handle(state, image));
    } else if (!state.enabled && state.subscription) {
        state.subscription.remove();
        state.subscription = null;
    }
}
// Exported for testing purposes only.
export function initObserveIntegrationIfNeededImpl(activate) {
    const observe = requireOptionalNativeModule('ExpoObserve');
    if (!observe) {
        return;
    }
    const state = {
        enabled: false,
        threshold: DEFAULT_OVERSIZE_THRESHOLD,
        includeUrlParams: false,
        reported: new Set(),
        subscription: null,
        appMetrics: requireOptionalNativeModule('ExpoAppMetrics'),
        imageModule: requireOptionalNativeModule('ExpoImage')
    };
    activate(state, observe.getIntegrations());
    observe.addListener('configure', ({ integrations })=>activate(state, integrations));
}
/**
 * Wires the expo-observe oversized-image integration. Idempotent.
 */ export function initObserveIntegrationIfNeeded() {
    if (initialized) {
        return;
    }
    initialized = true;
    initObserveIntegrationIfNeededImpl(activate);
}

//# sourceMappingURL=observe.js.map
