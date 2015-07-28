var hooksPerAction = {};
var fs = require('fs');

// hooksPerAction={action:[function(options)]} //as of now no callbacks

var add = function (module, func) {
    if (!hooksPerAction.hasOwnProperty(module)) {
        hooksPerAction[module] = [];
    }
    hooksPerAction[module].push(func);
};

var runHooks = function (module, options) {
    if (!hooksPerAction.hasOwnProperty(module)) {
        return;
    }
    for (var id in hooksPerAction[module]) {
        if (hooksPerAction[module].hasOwnProperty(id)) {
            hooksPerAction[module][id](options);
        }
    }
};

var loadModules = function () {
    var actionModules = fs.readdirSync(global.localdir + '/hooks/action');
    for (var id in actionModules) {
        if (actionModules.hasOwnProperty(id)) {
            require(global.localdir + '/hooks/action/' + actionModules[id]);
        }
    }
};

module.exports.add = add;
module.exports.runHooks = runHooks;
module.exports.loadModules = loadModules;
