require('dotenv').config();
// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require('@slack/bolt');
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

const getAssignmentId = (text) => {
  if (text) {
    return text
      .toUpperCase()            // Normalize for inconsistency with "assign" text
      .split('ASSIGN ')[1]      // Split into array and get first segment after "assign"
      .match(/\<(.*?)\>/g)[0]   // Match only the first user ID (in case multiple were provided)
      .toString();              // Array to string
    // Expected output: '<@U01238R77J6>'
  }
}

/*------------------
    BOT EVENTS
------------------*/

app.event('app_mention', async({ event, context }) => {
  // Gather applicable info
  const text = event.text;
  const normalizedText = text.toLowerCase();  // normalizes capitalization in commands
  const sentByUser = `<@${event.user}>`;
  const channel = event.channel;
  const botToken = context.botToken;

  /*--
    "assign [@user]"
    Assign a user to be the Twitter rotation concierge
  --*/
  if (normalizedText.includes('> assign <@')) {
    try {
      const assigned = getAssignmentId(text);
      const list = JSON.parse(fs.readFileSync(rotaFile));
      list['twirota'] = assigned;
      fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));

      const result = await app.client.chat.postMessage({
        token: botToken,
        channel: channel,
        text: `${assigned} is now on-call for Twitter rotation.`
      });
    }
    catch (err) {
      console.error(err);
      const errorResult = await app.client.chat.postMessage({
        token: botToken,
        channel: channel,
        text: 'An error has occurred while trying to assign the Twitter rotation concierge:\n```' + JSON.stringify(err) + '```'
      });
    }
  }

  /*--
    "who"
    Find out who the Twitter rotation concierge is right now
  --*/
  else if (normalizedText.includes('> who') && normalizedText.endsWith(' who')) {
    try {
      const list = JSON.parse(fs.readFileSync(rotaFile));
      const oncallName = list['twirota'];

      if (oncallName) {
        const result = await app.client.chat.postMessage({
          token: botToken,
          channel: channel,
          text: '`' + oncallName + '` is the Twitter rotation concierge. To notify them directly, mention `@twirota` in your message.'
        });
      } else {
        const result = await app.client.chat.postMessage({
          token: botToken,
          channel: channel,
          text: 'Nobody is currently assigned for Twitter rotation. To assign someone, use `@twirota assign [@user]`'
        });
      }
    }
    catch (err) {
      console.error(err);
      const errorResult = await app.client.chat.postMessage({
        token: botToken,
        channel: channel,
        text: 'An error has occurred trying to determine who is on-call for Twitter rotation concierge:\n```' + JSON.stringify(err) + '```'
      });
    }
  }

  /*--
    "clear"
    Assign a user to be the Twitter rotation concierge
  --*/
  if (normalizedText.includes('> clear') && normalizedText.endsWith('clear')) {
    try {
      const list = JSON.parse(fs.readFileSync(rotaFile));

      if (list['twirota']) {
        delete list['twirota'];
        fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));

        const result = await app.client.chat.postMessage({
          token: botToken,
          channel: channel,
          text: 'Twitter rotation concierge has been unassigned.'
        });
      } else {
        const result = await app.client.chat.postMessage({
          token: botToken,
          channel: channel,
          text: 'There is currently nobody assigned to Twitter rotation. Nothing changed.'
        });
      }
    }
    catch (err) {
      console.error(err);
      const errorResult = await app.client.chat.postMessage({
        token: botToken,
        channel: channel,
        text: 'An error has occurred while trying to assign the Twitter rotation concierge:\n```' + JSON.stringify(err) + '```'
      });
    }
  }

  /*--
    Sending a message for the concierge
    - Send a DM to the concierge notifying them where they're needed
    - Notify if there is no concierge assigned
  --*/
  else {
    try {
      const list = JSON.parse(fs.readFileSync(rotaFile));
      const oncallUser = list['twirota'];

      if (oncallUser) {
        // @TODO: send a DM with a link to this message to the concierge
      } else {
        const result = await app.client.chat.postMessage({
          token: botToken,
          channel: channel,
          text: 'Nobody is currently assigned for Twitter rotation. To assign someone, use `@twirota assign [@user]`'
        });
      }
    }
    catch (err) {
      console.error(err);
      const errorResult = await app.client.chat.postMessage({
        token: botToken,
        channel: channel,
        text: 'An error has occurred contacting the Twitter rotation concierge:\n```' + JSON.stringify(err) + '```'
      });
    }
  }
  // Log useful things
  console.log('Event: ', event, 'Context: ', context);
});

/*------------------
     START APP
------------------*/
(async () => {
  await app.start(port);
  console.log(`⚡️ Rota is running on ${port}!`);
})();
