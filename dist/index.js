"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bs = require("nodestalker");
const config_1 = require("./lib/config");
const callback_1 = require("./lib/callback");
console.log('>> DeBaDe Beanstalk Trigger <<');
(config_1.default.subscribers || []).forEach(({ tube, callbacks }) => {
    const client = bs.Client(config_1.default.server);
    const reserveJob = () => {
        client.reserve().onSuccess(async (job) => {
            console.debug(`tube[${tube}]: <= ${job.id}`);
            await Promise.all(callbacks.map((options) => callback_1.default(job.data, options)));
            client.deleteJob(job.id).onSuccess(reserveJob);
        });
    };
    console.log(`watching tube[${tube}]...`);
    client.watch(tube).onSuccess(reserveJob);
});
