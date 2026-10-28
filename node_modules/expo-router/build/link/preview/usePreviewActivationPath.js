"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "usePreviewActivationPath", {
    enumerable: true,
    get: function() {
        return usePreviewActivationPath;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _internalNavigationEvents = require("../../global-state/internalNavigationEvents");
const _hooks = require("../../hooks");
const _utils = require("./utils");
function usePreviewActivationPath() {
    const router = (0, _hooks.useRouter)();
    const linkId = (0, _react().useId)();
    const attempt = (0, _react().useRef)(0);
    const previewId = (0, _react().useRef)(undefined);
    const [activationPath, setActivationPath] = (0, _react().useState)();
    const onRoutePreloaded = (0, _react().useEffectEvent)(({ routeKey, state })=>{
        const id = previewId.current;
        if (id === undefined) return;
        const nextActivationPath = (0, _utils.findPreviewActivationPath)(state, routeKey, id);
        if (nextActivationPath) {
            // Give react-native-screens time to mount the preloaded route before native code
            // walks the view hierarchy to resolve this path.
            setTimeout(()=>{
                if (previewId.current === id) {
                    setActivationPath(nextActivationPath);
                }
            });
        }
    });
    (0, _react().useEffect)(()=>_internalNavigationEvents.internalNavigationEvents.addListener('routePreloaded', onRoutePreloaded), []);
    const cancel = (0, _react().useCallback)(()=>{
        previewId.current = undefined;
        setActivationPath(undefined);
    }, []);
    const prefetch = (0, _react().useCallback)((href)=>{
        setActivationPath(undefined);
        const id = `${linkId}:${++attempt.current}`;
        previewId.current = id;
        router.prefetch(href, {
            __internal__previewId: id
        });
    }, [
        linkId,
        router.prefetch
    ]);
    return [
        activationPath,
        prefetch,
        cancel
    ];
}

//# sourceMappingURL=usePreviewActivationPath.js.map
