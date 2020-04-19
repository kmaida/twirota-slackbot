require('dotenv').config();
// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require('@slack/bolt');
const fs = require('fs');
const rotaFile = './rotations.json';

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
    APP MENTIONS
------------------*/

app.event('app_mention', async({ event, context }) => {
  // Gather applicable info
  const text = event.text;
  const normalizedText = text.toLowerCase();  // normalizes capitalization in commands
  const sentByUser = event.user;
  const channel = event.channel;
  const botToken = context.botToken;

  /*------------------
    "assign [@user]"
    Assign a user to be the Twitter rotation concierge
  ------------------*/
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

  /*------------------
    "who"
    Find out who the Twitter rotation concierge is right now
  ------------------*/
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

  /*------------------
    "clear"
    Assign a user to be the Twitter rotation concierge
  ------------------*/
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

  /*------------------
    Send a message directly to the concierge
    - Sends a DM to the concierge notifying them where they're needed
    - Notify in channel if there is no concierge assigned
  ------------------*/
  else if (!normalizedText.endsWith('> who') && !normalizedText.includes('> assign <@') && !normalizedText.endsWith('> help')) {
    try {
      const list = JSON.parse(fs.readFileSync(rotaFile));
      const oncallUser = list['twirota'];

      if (oncallUser) {
        const link = `https://${process.env.SLACK_TEAM}.slack.com/archives/${event.channel}/p${event.ts.replace('.', '')}`;
        const sendDM = await app.client.chat.postMessage({
          token: botToken,
          channel: oncallUser.replace('<@', '').replace('>', ''),
          text: `Hi there! <@${sentByUser}> needs your attention in <#${event.channel}> (${link}) \n\n`
        });
        const sendPublicMsg = await app.client.chat.postMessage({
          token: botToken,
          channel: channel,
          text: 'A message has been sent to the Twitter rotation concierge. If your message is urgent and you don\'t receive a reply within 15 minutes, please use `@here` or `@channel`.'
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
        text: 'An error has occurred contacting the Twitter rotation concierge:\n```' + JSON.stringify(err) + '```'
      });
    }
  }

  /*------------------
    "help"
  ------------------*/
  else if (normalizedText.endsWith('> help')) {
    const result = await app.client.chat.postMessage({
      token: botToken,
      channel: channel,
      text: 'Hi there, I\'m Twirota, the Twitter rotation concierge bot! Here\'s what I can do:\n• Ask `@twirota who` to check who is currently assigned for Twitter rotation.\n• Type `@twirota assign [@username]` to assign someone to Twitter rotation.\n• Mention `@twirota` in a message to send a DM to the person currently on call.\n• Enter `@twirota clear` to reset the rotation and unassign the person currently on call.'
    });
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
