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

