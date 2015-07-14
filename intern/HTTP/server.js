var app = require("express")(),
	fs = require("fs")
if (global.config.httpsPort !== 0) {
	var https = require('http2').createServer({
		key: fs.readFileSync(global.config.httpsKey),
		cert: fs.readFileSync(global.config.httpsCert)
	}, app).listen(global.config.httpsPort)
}
if (global.config.httpPort !== 0) {
	var http = require('http').createServer(app).listen(global.config.httpPort);
	global.io = require('socket.io')(http);
}
var streamOutput = require("../streams/httphandler.js"),
	streamInput = require("../streams/inputhandler.js")

app.enable('trust proxy');
app.use(function(req, res, next) {
	res.setHeader('X-Powered-By', 'Cast 1.0')
	res.setHeader('Server', "Cast/1.0")
	next()
})

var files = fs.readdirSync(global.localdir + "/intern/HTTP/apps/")
for (var id in files) {
	if (files.hasOwnProperty(id)) {
		require(global.localdir + "/intern/HTTP/apps/" + files[id])(app)
	}
}

var files = fs.readdirSync(global.localdir + "/hooks/http/") //load HTTP hooks
for (var id in files) {
	if (files.hasOwnProperty(id)) {
		require(global.localdir + "/hooks/http/" + files[id])(app)
	}
}


streamOutput(app)
streamInput(global.config)

module.exports = app
