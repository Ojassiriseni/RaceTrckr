import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StyleSheet } from 'react-native';
export function getTintColorStyle(tintId, tintColor) {
    if (!tintColor) {
        return {};
    }
    return {
        filter: `url(#expo-image-tint-${tintId})`
    };
}
export default function TintColorFilter({ id, tintColor }) {
    if (!tintColor) {
        return null;
    }
    return /*#__PURE__*/ _jsx("svg", {
        style: styles.svg,
        children: /*#__PURE__*/ _jsx("defs", {
            children: /*#__PURE__*/ _jsxs("filter", {
                id: `expo-image-tint-${id}`,
                children: [
                    /*#__PURE__*/ _jsx("feFlood", {
                        floodColor: tintColor
                    }),
                    /*#__PURE__*/ _jsx("feComposite", {
                        in2: "SourceAlpha",
                        operator: "atop"
                    })
                ]
            })
        })
    });
}
const styles = StyleSheet.create({
    svg: {
        width: 0,
        height: 0
    }
});

//# sourceMappingURL=ColorTintFilter.js.map
