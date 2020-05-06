import * as bs from 'nodestalker';
import config from './lib/config';
import fetch from 'cross-fetch';
import { createHmac } from 'crypto';

console.log('>> DeBaDe Beanstalk Trigger <<');

const client = bs.Client(config.server);
(config.subscribers || []).forEach(({ tube, callbacks }) => {
  const reserveJob = () => {
    client.reserve().onSuccess(async (job) => {
      console.debug(`tube[${tube}]: <= ${job.id}`);
      await Promise.all(
        callbacks.map(async ({ type, ...rest }) => {
          if (type === 'jsonrpc') {
            try {
              const data = JSON.parse(job.data);
              const body = Buffer.from(
                JSON.stringify({
                  jsonrpc: '2.0',
                  method: rest.method,
                  params: [data],
                }),
                'utf8',
              );
              await fetch(rest.url, {
                method: 'POST',
                headers: {
                  'X-DeBaDe-Token': createHmac('sha1', rest.secret).update(body).digest('base64'),
                },
                body,
              });
            } catch {}
          } else if (type === 'rest') {
            const body = Buffer.from(job.data, 'utf8');
            try {
              await fetch(rest.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=UTF-8',
                  'X-DeBaDe-Token': createHmac('sha1', rest.secret).update(body).digest('base64'),
                },
                body,
              });
            } catch {}
          }
        }),
      );
      client.deleteJob(job.id).onSuccess(reserveJob);
    });
  };

  console.log(`watching tube[${tube}]...`);
  client.watch(tube).onSuccess(reserveJob);
});
