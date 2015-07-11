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
    
    

}

