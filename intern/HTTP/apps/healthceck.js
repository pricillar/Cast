export default (app) => {
    app.get("/health_check", (req, res) => {
        res.json({healthy: true})
    })
}
