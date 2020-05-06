"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bs = require("nodestalker");
const config_1 = require("./lib/config");
const cross_fetch_1 = require("cross-fetch");
const crypto_1 = require("crypto");
console.log('>> DeBaDe Beanstalk Trigger <<');
const client = bs.Client(config_1.default.server);
(config_1.default.subscribers || []).forEach(({ tube, callbacks }) => {
    const reserveJob = () => {
        client.reserve().onSuccess(async (job) => {
            console.debug(`tube[${tube}]: <= ${job.id}`);
            await Promise.all(callbacks.map(async (_a) => {
                var { type } = _a, rest = __rest(_a, ["type"]);
                if (type === 'jsonrpc') {
                    try {
                        const data = JSON.parse(job.data);
                        const body = Buffer.from(JSON.stringify({
                            jsonrpc: '2.0',
                            method: rest.method,
                            params: [data],
                        }), 'utf8');
                        await cross_fetch_1.default(rest.url, {
                            method: 'POST',
                            headers: {
                                'X-DeBaDe-Token': crypto_1.createHmac('sha1', rest.secret).update(body).digest('base64'),
                            },
                            body,
                        });
                    }
                    catch (_b) { }
                }
                else if (type === 'rest') {
                    const body = Buffer.from(job.data, 'utf8');
                    try {
                        await cross_fetch_1.default(rest.url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json;charset=UTF-8',
                                'X-DeBaDe-Token': crypto_1.createHmac('sha1', rest.secret).update(body).digest('base64'),
                            },
                            body,
                        });
                    }
                    catch (_c) { }
                }
            }));
            client.deleteJob(job.id).onSuccess(reserveJob);
        });
    };
    console.log(`watching tube[${tube}]...`);
    client.watch(tube).onSuccess(reserveJob);
});
