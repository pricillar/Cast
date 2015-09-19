var geojson=require('geojson')

module.exports = function(app) {

    app.get("/api/*/past-metadata", function(req, res) {
        res.json(global.streams.getPastMedatada(req.params[0]) || {})
    })
    
    app.get("/api/*/current-metadata", function(req, res) {
        res.json(global.streams.getStreamMetadata(req.params[0]))
    })
    
    app.get("/api/*/statistics", function(req, res) {
        res.send('Soon available')

    })
    
    app.get("/api/list-active-streams", function(req, res) {
        res.json(global.streams.getActiveStreams())
    })
    
    app.get("/api/*/*/listeners",function(req, res) {
        if (req.params[1]!==global.config.apikey){
            res.status(400).json({error:"Invalid API key"})
            return
        }
        res.json(global.streams.getListeners(req.params[0]))
    })
    
    
    app.get("/api/*/*/unique-listeners",function(req, res) {
        if (req.params[1]!==global.config.apikey){
            res.status(400).json({error:"Invalid API key"})
            return
        }
        res.json(global.streams.getUniqueListeners(req.params[0]))
    })
    
    app.get("/api/*/*/listenersmap",function(req, res) {
        if (req.params[1]!==global.config.apikey){
            return res.status(400).json({error:"Invalid API key"})
        }
        if (typeof global.config.geoservices === "undefined" || !global.config.geoservices.enabled){
            return res.status(500).json({error: "GeoServices is disabled"})
        }
        
        var listeners=global.streams.getListeners(req.params[0])
        
        var geoArray=[]
        
        for (var id in listeners){
            if (typeof listeners[id].location !== "undefined"){
                geoArray.push({name: listeners[id].client || listeners[id].ip, ip:listeners[id].ip, latitude:listeners[id].location.latitude,longitude:listeners[id].location.longitude})
            }
        }
        res.setHeader("Content-Type", "application/json");
        res.send(geojson.parse(geoArray, {Point: ["latitude", "longitude"]}))
    })
    
    app.post("/api/*/*/end",function(req, res) {
        if (req.params[1]!==global.config.apikey){
            res.status(400).json({error:"Invalid API key"})
            return
        }
        if (!global.streams.isStreamInUse(req.params[0])){
            res.status(400).json({error:"Stream is not in use"})
            return
        }
        global.streams.endStream(req.params[0])
        res.json({result:"okay"})
    })

}

