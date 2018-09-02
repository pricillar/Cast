if (config.geolock && config.geolock.enabled && !global.maxmind) {
    global.maxmind = require("maxmind").openSync(global.config.geolock.maxmindDatabase)
    if (!maxmind) {
        console.log("Error loading Maxmind Database")
    }
}

export function isAllowed(ip) {
    if (typeof config.geolock === "undefined" || !config.geolock.enabled) {
        return true
    }
    let ipLocation = maxmind.get(ip)
    let isAllowlistMode = config.geolock.mode === "allowlist" || config.geolock.mode === "whitelist" // the last value is deprecated
    if (!ipLocation) {
        return isAllowlistMode || config.geolock.allowUnknown
    }
    if (config.geolock.countryCodes.indexOf(ipLocation.country.iso_code) === -1) {
        return !isAllowlistMode
    }
    return isAllowlistMode
}
