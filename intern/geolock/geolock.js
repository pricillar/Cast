if (typeof global.config.geolock !== "undefined" && global.config.geolock.enabled && typeof global.maxmind === "undefined") {
    global.maxmind = require("maxmind")
    if (!global.maxmind.init(global.config.geolock.maxmindDatabase)){
        console.log("Error loading Maxmind Database")
    }
}

module.exports.isAllowed = function(ip) {
    if (typeof global.config.geolock === "undefined" || !global.config.geolock.enabled) {
        return true
    }
    var ipLocation=global.maxmind.getLocation(ip)
    var isWhilelistMode= global.config.geolock.mode === "whitelist"
    if (ipLocation === null){
        return isWhilelistMode
    }
    
    if (global.config.geolock.countryCodes.indexOf(ipLocation.countryCode) == -1){
        return !isWhilelistMode
    }else{
        return isWhilelistMode
    }
}