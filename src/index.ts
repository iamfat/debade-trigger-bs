import * as bs from 'nodestalker';
import config from './lib/config';
import callback from './lib/callback';

console.log('>> DeBaDe Beanstalk Trigger <<');

(config.subscribers || []).forEach(({ tube, callbacks }) => {
  const client = bs.Client(config.server);

  const reserveJob = () => {
    client.reserve().onSuccess(async (job) => {
      console.debug(`tube[${tube}]: <= ${job.id}`);
      await Promise.all(callbacks.map((options) => callback(job.data, options)));
      client.deleteJob(job.id).onSuccess(reserveJob);
    });
  };

  console.log(`watching tube[${tube}]...`);
  client.watch(tube).onSuccess(reserveJob);
});
