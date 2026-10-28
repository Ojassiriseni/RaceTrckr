import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
// TODO(@kitten): We shouldn't be importing all of react-native-web or rely on it for a web module in this way optimally
import { View } from 'react-native-web';
import AnimationManager from './web/AnimationManager';
import ImageWrapper from './web/ImageWrapper';
import loadStyle from './web/imageStyles';
import useSourceSelection from './web/useSourceSelection';
loadStyle();
function onLoadAdapter(onLoad) {
    return (event)=>{
        const target = event.target;
        onLoad?.({
            source: {
                url: target.currentSrc,
                width: target.naturalWidth,
                height: target.naturalHeight,
                mediaType: null
            },
            cacheType: 'none'
        });
    };
}
function onErrorAdapter(onError) {
    return ({ source })=>{
        onError?.({
            error: `Failed to load image from url: ${source?.uri}`
        });
    };
}
// Used for flip transitions to mimic native animations
function setCssVariablesForFlipTransitions(element, size) {
    element?.style.setProperty('--expo-image-width', `${size.width}px`);
    element?.style.setProperty('--expo-image-height', `${size.height}px`);
}
function isFlipTransition(transition) {
    return transition?.effect === 'flip-from-bottom' || transition?.effect === 'flip-from-top' || transition?.effect === 'flip-from-left' || transition?.effect === 'flip-from-right';
}
function getAnimationKey(source, recyclingKey) {
    const uri = source && 'uri' in source && source.uri || '';
    return recyclingKey ? [
        recyclingKey,
        uri
    ].join('-') : uri;
}
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, placeholderContentFit, cachePolicy, onLoad, transition, onError, responsivePolicy, onLoadEnd, onDisplay, priority, loading, blurRadius, recyclingKey, style, nativeViewRef, accessibilityLabel, alt, tintColor, containerViewRef, draggable, dataSet, // Destructured so it isn't forwarded to the DOM. SVG variables are a native-only feature.
svgVariables, ...props }) {
    const imagePlaceholderContentFit = placeholderContentFit || 'scale-down';
    const imageHashStyle = {
        objectFit: placeholderContentFit || contentFit
    };
    const resolvedLoading = loading ?? (responsivePolicy == null || responsivePolicy === 'static' ? 'lazy' : undefined);
    const selectedSource = useSourceSelection(source, responsivePolicy, // TODO(@vonovak): this cast is a workaround
    containerViewRef, isFlipTransition(transition) ? setCssVariablesForFlipTransitions : null);
    // TODO(@kitten): This should narrow before accessing `placeholder?.[0]`
    const firstPlaceholder = placeholder?.[0];
    const initialNodeAnimationKey = getAnimationKey(firstPlaceholder, recyclingKey);
    const initialNode = firstPlaceholder?.uri ? [
        initialNodeAnimationKey,
        ({ onAnimationFinished })=>(className, style)=>/*#__PURE__*/ _jsx(ImageWrapper, {
                    ref: nativeViewRef,
                    source: firstPlaceholder,
                    style: {
                        objectFit: imagePlaceholderContentFit,
                        ...blurRadius ? {
                            filter: `blur(${blurRadius}px)`
                        } : {},
                        ...style
                    },
                    className: className,
                    events: {
                        onTransitionEnd: [
                            onAnimationFinished
                        ]
                    },
                    contentPosition: {
                        left: '50%',
                        top: '50%'
                    },
                    hashPlaceholderContentPosition: contentPosition,
                    hashPlaceholderStyle: imageHashStyle,
                    accessibilityLabel: accessibilityLabel ?? alt,
                    cachePolicy: cachePolicy,
                    priority: priority,
                    loading: resolvedLoading,
                    tintColor: tintColor,
                    draggable: draggable
                })
    ] : null;
    // @ts-expect-error: TODO(@kitten): This was implicitly cast to `any`, but with correct types this is now a mismatch
    const currentNodeAnimationKey = getAnimationKey(selectedSource ?? firstPlaceholder, recyclingKey);
    const currentNode = [
        currentNodeAnimationKey,
        ({ onAnimationFinished, onReady, onMount, onError: onErrorInner })=>(className, style)=>/*#__PURE__*/ _jsx(ImageWrapper, {
                    ref: nativeViewRef,
                    // @ts-expect-error: TODO(@kitten): This was implicitly cast to `any`, but with correct types this is now a mismatch
                    source: selectedSource || firstPlaceholder,
                    events: {
                        onError: [
                            onErrorAdapter(onError),
                            onLoadEnd,
                            onErrorInner
                        ],
                        onLoad: [
                            onLoadAdapter(onLoad),
                            onLoadEnd,
                            onReady
                        ],
                        onMount: [
                            onMount
                        ],
                        onTransitionEnd: [
                            onAnimationFinished
                        ],
                        onDisplay: [
                            onDisplay
                        ]
                    },
                    style: {
                        objectFit: selectedSource ? contentFit : imagePlaceholderContentFit,
                        ...blurRadius ? {
                            filter: `blur(${blurRadius}px)`
                        } : {},
                        ...style
                    },
                    className: className,
                    cachePolicy: cachePolicy,
                    priority: priority,
                    loading: resolvedLoading,
                    contentPosition: selectedSource ? contentPosition : {
                        top: '50%',
                        left: '50%'
                    },
                    hashPlaceholderContentPosition: contentPosition,
                    hashPlaceholderStyle: imageHashStyle,
                    accessibilityLabel: accessibilityLabel,
                    tintColor: tintColor,
                    draggable: draggable
                })
    ];
    return /*#__PURE__*/ _jsx(View, {
        ref: containerViewRef,
        // @ts-expect-error: TODO(@kitten): This is related to react-native-web presumably
        dataSet: {
            ...dataSet,
            expoimage: 'true'
        },
        style: [
            {
                overflow: 'hidden'
            },
            style
        ],
        ...props,
        children: /*#__PURE__*/ _jsx(AnimationManager, {
            transition: transition,
            recyclingKey: recyclingKey,
            initial: initialNode,
            children: currentNode
        })
    });
}

//# sourceMappingURL=ExpoImage.web.js.map
