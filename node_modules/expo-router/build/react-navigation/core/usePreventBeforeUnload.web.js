"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "usePreventBeforeUnload", {
    enumerable: true,
    get: function() {
        return usePreventBeforeUnload;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
function usePreventBeforeUnload(preventBeforeUnload) {
    const isDisabledRef = (0, _react().useRef)(false);
    const preventUnload = (0, _react().useEffectEvent)((event)=>{
        if (preventBeforeUnload && !isDisabledRef.current) {
            event.preventDefault();
            event.returnValue = true;
        }
    });
    (0, _react().useEffect)(()=>{
        isDisabledRef.current = false;
        if (!preventBeforeUnload) {
            return;
        }
        const handleBeforeUnload = (event)=>preventUnload(event);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return ()=>window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [
        preventBeforeUnload
    ]);
    return (0, _react().useCallback)(()=>{
        isDisabledRef.current = true;
    }, []);
}

//# sourceMappingURL=usePreventBeforeUnload.web.js.map
