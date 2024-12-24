import { articleHandler } from './handlers/article-handler';
import { jobHandler } from './handlers/job-handler';
import { slackApp } from './libs/slack';

articleHandler();
jobHandler();

(async () => {
  await slackApp.start();
  console.log('⚡️ Slack bot is running with Socket Mode!');
})();
