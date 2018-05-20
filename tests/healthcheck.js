import test from "ava"
import sinon from "sinon"
import express from "express"
import healthcheck from "../intern/HTTP/apps/healthcheck.js"
import request from "supertest"


const makeApp = () => {
    const app = express();
    return app;
}

test("test healthy", async t => {
    const app = makeApp()
    healthcheck(app)
    const res = await request(app)
        .get("/health_check")

    t.is(res.status, 200);
    t.is(res.body.healthy, true);
})
