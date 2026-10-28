"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    default: null,
    resolveProps: null,
    setAndroidStatusBarStyles: null,
    setIOSStatusBarInfoPlist: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get default () {
        return _default;
    },
    get resolveProps () {
        return resolveProps;
    },
    get setAndroidStatusBarStyles () {
        return setAndroidStatusBarStyles;
    },
    get setIOSStatusBarInfoPlist () {
        return setIOSStatusBarInfoPlist;
    }
});
function _configplugins() {
    const data = require("expo/config-plugins");
    _configplugins = function() {
        return data;
    };
    return data;
}
const pkg = require('../../package.json');
const IOS_BAR_STYLE_MAP = {
    dark: 'UIStatusBarStyleDarkContent',
    light: 'UIStatusBarStyleLightContent'
};
function resolveProps(props) {
    if (props == null) {
        return;
    }
    const { hidden, style } = props;
    const resolvedProps = {
        ...style != null && {
            style
        },
        ...hidden != null && {
            hidden
        }
    };
    if (Object.keys(resolvedProps).length > 0) {
        return resolvedProps;
    }
    return;
}
const setAndroidStatusBarStyles = (styles, { hidden, style })=>{
    styles = _configplugins().AndroidConfig.Styles.assignStylesValue(styles, {
        add: hidden != null,
        parent: _configplugins().AndroidConfig.Styles.getAppThemeGroup(),
        name: 'expoStatusBarHidden',
        value: String(hidden)
    });
    styles = _configplugins().AndroidConfig.Styles.assignStylesValue(styles, {
        // Adding means the buttons will be darker to account for a light background color.
        // `setStyle('dark')` should do the same thing.
        add: style != null,
        parent: _configplugins().AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowLightStatusBar',
        value: String(style === 'dark')
    });
    return styles;
};
const withAndroidStatusBarStyles = (config, props)=>{
    return (0, _configplugins().withAndroidStyles)(config, (config)=>{
        config.modResults = setAndroidStatusBarStyles(config.modResults, props);
        return config;
    });
};
const setIOSStatusBarInfoPlist = (plist, { hidden, style } = {})=>{
    if (hidden != null) {
        plist.UIStatusBarHidden = hidden;
    }
    if (style != null) {
        plist.UIStatusBarStyle = IOS_BAR_STYLE_MAP[style];
    }
    return plist;
};
const withIOSStatusBarInfoPlist = (config, props)=>(0, _configplugins().withInfoPlist)(config, (config)=>{
        config.modResults = setIOSStatusBarInfoPlist(config.modResults, props);
        return config;
    });
const withStatusBar = (config, _props)=>{
    const props = resolveProps(_props);
    if (props == null) {
        return config;
    }
    // Elevate props to a static value on extra so Expo Go can read it.
    config.extra ??= {};
    config.extra[pkg.name] = props;
    config = withAndroidStatusBarStyles(config, props);
    return withIOSStatusBarInfoPlist(config, props);
};
const _default = (0, _configplugins().createRunOncePlugin)(withStatusBar, pkg.name, pkg.version);

//# sourceMappingURL=withStatusBar.js.map
