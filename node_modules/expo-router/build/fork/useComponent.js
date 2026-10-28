'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useComponent", {
    enumerable: true,
    get: function() {
        return useComponent;
    }
});
function _jsxruntime() {
    const data = require("react/jsx-runtime");
    _jsxruntime = function() {
        return data;
    };
    return data;
}
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const NavigationContent = ({ render, children })=>{
    return render(children);
};
function useComponent(render) {
    const renderRef = (0, _react().useRef)(render);
    // Normally refs shouldn't be mutated in render
    // But we return a component which will be rendered
    // So it's just for immediate consumption
    renderRef.current = render;
    (0, _react().useEffect)(()=>{
        renderRef.current = null;
    });
    return (0, _react().useRef)(({ children })=>{
        const render = renderRef.current;
        if (render === null) {
            throw new Error('The returned component must be rendered in the same render phase as the hook.');
        }
        return /*#__PURE__*/ (0, _jsxruntime().jsx)(NavigationContent, {
            render: render,
            children: children
        });
    }).current;
}

//# sourceMappingURL=useComponent.js.map
