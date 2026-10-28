'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, StyleSheet } from 'react-native';
import { Image } from './Image';
export function ImageBackground({ style, imageStyle, children, ...props }) {
    return /*#__PURE__*/ _jsxs(View, {
        style: style,
        children: [
            /*#__PURE__*/ _jsx(Image, {
                ...props,
                style: [
                    StyleSheet.absoluteFill,
                    imageStyle
                ]
            }),
            children
        ]
    });
}

//# sourceMappingURL=ImageBackground.js.map
