if (config.geolock && config.geolock.enabled && !global.maxmind) {
    if (config.geolock.customModule) {
        global.maxmind = require(config.geolock.customModule)
    } else {
        global.maxmind = require("maxmind").openSync(global.config.geolock.maxmindDatabase)
        if (!maxmind) {
            console.log("Error loading Maxmind Database")
        }
    }
}

export async function isAllowed(ip) {
    if (typeof config.geolock === "undefined" || !config.geolock.enabled) {
        return true
    }

    let isAllowlistMode = config.geolock.mode === "allowlist" || config.geolock.mode === "whitelist" // the last value is deprecated

    try {
        let ipLocation = maxmind.get(ip)
        if (typeof ipLocation.then === "function") {
            ipLocation = await ipLocation // in case module gives a promise
        }
        if (!ipLocation) {
            return config.geolock.allowUnknown ? true : false
        }
        if (config.geolock.countryCodes.indexOf(ipLocation.country.iso_code) === -1) {
            return !isAllowlistMode
        }
    } catch (error) {
        console.log(error)
    }

    return config.geolock.allowUnknown ? true : false
}
