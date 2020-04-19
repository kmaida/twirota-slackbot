require('dotenv').config();
// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require('@slack/bolt');
// Create Bolt app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});
const port = process.env.PORT || 3000;

/* BOT FUNCTIONALITY */
app.event('app_mention', async({ event, context }) => {
  console.log(event, context);
  try {
    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: event.channel,
      text: 'You mentioned me!'
    });
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
});

// Start Bolt app
(async () => {
  await app.start(port);
  console.log(`⚡️ Rota is running on ${port}!`);
})();
