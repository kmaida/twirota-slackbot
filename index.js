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

// Returns true/false if mention text matches the passed simple command (command with no paramters)
const matchSimpleCommand = (cmd, e, ct) => {
  const normalizedText = e.text.toLowerCase().trim();
  const botUserLower = ct.botUserId.toLowerCase();
  const cmdInput = cmd.toLowerCase().trim();
  return (normalizedText === `<@${botUserLower}> ${cmdInput}`);
}

// Returns true if mention text matches properly formatted "assign" command
const isAssign = (e, ct) => {
  const normalizedText = e.text.toLowerCase().trim();
  const botUserLower = ct.botUserId.toLowerCase();
  return (normalizedText.startsWith(`<@${botUserLower}> assign <@`) && normalizedText.endsWith('>'));
}

// Takes raw message text and extracts user assignment ID in a message-safe format
const getAssignmentMsgTxt = (text) => {
  if (text) {
    return text
      .toUpperCase()                  // Normalize for inconsistency with "assign" text
      .split('ASSIGN ')[1]            // Split into array and get first segment after "assign"
      .match(/<@U[A-Z0-9]*?>/g)[0]    // Match only the first user ID (in case multiple were provided)
      .toString();                    // Array to string
    // Expected output: '<@U01238R77J6>'
  }
}

/*------------------
    APP MENTIONS
------------------*/

app.event('app_mention', async({ event, context }) => {
  // Gather applicable info
  const text = event.text;                           // raw text from the message mentioning @concierge
  const sentByUser = event.user;                     // user ID
  const channel = event.channel;                     // channel ID
  const botToken = context.botToken;

  /*------------------
    "assign [@user]"
    Assign a user to be the Twitter rotation concierge
  ------------------*/
  if (isAssign(event, context)) {
    try {
      const assigned = getAssignmentMsgTxt(text);
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
  else if (matchSimpleCommand('who', event, context)) {
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
  else if (matchSimpleCommand('clear', event, context)) {
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
    "help"
  ------------------*/
  else if (matchSimpleCommand('help', event, context)) {
    const result = await app.client.chat.postMessage({
      token: botToken,
      channel: channel,
      text: 'Hi there, I\'m Twirota, the Twitter rotation concierge bot! Here\'s what I can do:\n• Ask `@twirota who` to check who is currently assigned for Twitter rotation.\n• Type `@twirota assign [@username]` to assign someone to Twitter rotation.\n• Mention `@twirota` in a message to send a DM to the person currently on call.\n• Enter `@twirota clear` to reset the rotation and unassign the person currently on call.'
    });
  }

  /*------------------
    Send a message directly to the concierge
    - Sends a DM to the concierge notifying them where they're needed
    - Notify in channel if there is no concierge assigned
  ------------------*/
  else if (
    !matchSimpleCommand('who', event, context) && 
    !isAssign(event, context) && 
    !matchSimpleCommand('help', event, context) && 
    !matchSimpleCommand('clear', event, context)
  ) {
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
});

/*------------------
     START APP
------------------*/

(async () => {
  await app.start(port);
  console.log(`⚡️ Twiota is running on ${port}!`);
})();
