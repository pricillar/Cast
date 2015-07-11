var colors = require('colors');

console.log("Cast 1.0 ".rainbow+"Beta 1".inverse);
global.localdir=__dirname
global.cast={version:'1.0'} //defining build specific info

var fs = require('fs');
global.config = JSON.parse(fs.readFileSync(global.localdir+'/config.json', 'utf8'));
global.app=require("./intern/HTTP/server.js");
global.hooks=require("./hooks/hooks.js")
global.hooks.loadModules()
