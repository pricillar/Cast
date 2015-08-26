if (typeof global.config.geolock !== "undefined" && global.config.geolock.enabled) {
    var maxmind = require("maxmind")
    if (!maxmind.init(global.config.geolock.maxmindDatabase)){
        console.log("Error loading Maxmind Database")
    }
}

module.exports.isAllowed = function(ip) {
    if (typeof global.config.geolock === "undefined" || !global.config.geolock.enabled) {
        return true
    }
    var ipLocation=maxmind.getLocation(ip)
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