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

app.command('/twirota', async({ command, ack, say }) => {
  await ack();
  const commandText = command.text;
  const textCaseNormalized = commandText.toLowerCase();
  console.log(command);

  if (textCaseNormalized.includes('assign @')) {
    const assignment = `<${textCaseNormalized.split('assign ')[1]}>`;
    // try {
      let list = fs.readFileSync(rotaFile);
      list = JSON.parse(list);
      list['twirota'] = assignment;
      fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));
      console.log(list);
    // } catch (e) {
    //   return 'An error has occurred while trying to assign the concierge.\n```' + JSON.stringify(e) + '```';
    // }
    await say(`${assignment} is now on-call for rotation concierge duties.`);
  }
  if (textCaseNormalized === 'who' || textCaseNormalized === 'on-call') {
    await say(`Checking that for you...`);
  }
});

/*------------------
     START APP
------------------*/
(async () => {
  await app.start(port);
  console.log(`⚡️ Rota is running on ${port}!`);
})();
