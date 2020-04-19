require('dotenv').config();
// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require('@slack/bolt');
const rota = require('./rota');
const fs = require('fs');
const rotaFile = './rotations.json';

console.log(rotaFile);

// Create Bolt app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});
const port = process.env.PORT || 3000;

/*------------------
     UTILITIES
------------------*/

const jsonReader = (filePath, cb) => {
  fs.readFile(filePath, (err, fileData) => {
    if (err) {
      return cb && cb(err);
    }
    try {
      const obj = JSON.parse(fileData);
      return cb && cb(null, obj);
    }
    catch (err) {
      return cb && cb(err);
    }
  });
}

jsonReader(rotaFile, (err, twirota) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(twirota);
});

/*------------------
    BOT EVENTS
------------------*/

app.event('app_mention', async({ event, context }) => {
  try {
    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: event.channel,
      text: 'You mentioned me!'
    });
  }
  catch (error) {
    console.error(error);
  }
  // Bot commands
  console.log('Event: ', event, 'Context: ', context);
});

/*------------------
    BOT COMMANDS
------------------*/

app.command('/twirota-assign', async({ command, ack, say }) => {
  await ack();
  console.log(command);
  const assignment = `<${command.text}>`;
  // try {
    const list = JSON.parse(fs.readFileSync(rotaFile));
    list['twirota'] = assignment;
    fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));
    console.log(list);
  // } catch (e) {
  //   await say('An error has occurred while trying to assign the concierge.\n```' + JSON.stringify(e) + '```');
  // }
  await say(`${assignment} is now on-call for rotation concierge duties.`);
});

app.command('/twirota-who', async ({ command, ack, say }) => {
  await ack();
  const list = JSON.parse(fs.readFileSync(rotaFile));
  const oncallName = list['twirota'];
  if (oncallName) {
    await say('The Twitter rotation concierge is `' + oncallName + '`. To notify them directly, mention `@twirota` in your message.');
  } else {
    await say('Nobody is currently assigned for Twitter rotation. To assign someone, use `/twirota-assign [@user]`');
  }
});

app.command('/twirota-clear', async ({ command, ack, say }) => {
  await ack();
  const list = JSON.parse(fs.readFileSync(rotaFile));

  if (list['twirota']) {
    delete list['twirota'];
    fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));
    await say('Twitter rotation concierge has been unassigned.');
  } else {
    await say('There is currently nobody assigned for Twitter rotation.');
  }
});

/*------------------
     START APP
------------------*/
(async () => {
  await app.start(port);
  console.log(`⚡️ Rota is running on ${port}!`);
})();
