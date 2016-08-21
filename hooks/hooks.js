import fs from "fs"
import EventEmitter from "events"
class Events extends EventEmitter {}

global.events = new Events();

const actionModules = fs.readdirSync(global.localdir + "/hooks/action");
for (let module of actionModules) {
    if (fs.statSync(`${global.localdir}/hooks/action/${module}`).isFile() && module.split(".")[module.split(".").length -1] === "js") {
        require(`${global.localdir}/hooks/action/${module}`);
    }
}
