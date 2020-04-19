const fs = require('fs');
const dirname = require('path').dirname;
const rotaFile = dirname(__dirname) + '/rotations.json';

const rota = (event, context) => {
  // Initialize concierge on first run
  try {
    fs.accessSync(rotaFile, fs.F_OK);
  } catch (e) {
    // It isn't accessible
    try {
      fs.writeFileSync(rotaFile, '{}');
    } catch (er) {
      console.error('Unable to create rotation concierge file');
    }
  }

  return {
    callTwirota: (event) => {
      try {
        const list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        if (!list['twirota']) {
          return 'No Twitter Rotation assigned. Use `@twirota assign {@username}`';
        }

        const link = `https://${process.env.SLACK_TEAM}.slack.com/archives/${req.channel.name}/p${req.message.timestamp.replace('.', '')}`;
        const conciergeMessage = `@${req.from.name} needs your attention in #${req.channel.name} (${link}) \n\n*Message*:\n`;
        // TODO: send a DM to the concierge: conciergeMessage + req.message.value.text, list['twirota'];

        return 'A message has been sent to the Twitter Rotation concierge. If your message is urgent and you don\'t receive a reply, please use `@here` or `@channel`.';
      } catch (e) {
        return 'An error has occurred while trying to contact the concierge.\n```' + JSON.stringify(e) + '```';
      }
    },
    whosTwirota: (event) => {
      try {
        const list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        const conciergeName = list['twirota'];
        if (conciergeName) {
          return 'The Twitter Rotation concierge is `' + conciergeName + '`. To send a direct message to the Twitter Rotation concierge use `@twirota message: {text}`';
        }
        return 'No Twitter Rotation concierge is currently assigned.';
      } catch (e) {
        return 'An error has occurred while trying to assign the concierge.\n```' + JSON.stringify(e) + '```';
      }
    },
    assignTwirota: (event) => {
      try {
        const list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        const name = req.params.name;
        if (name.charAt(0) !== '@') {
          name = '@' + name;
        }

        list['twirota'] = name;
        fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));
        return 'User ' + name + ' has been assigned Twitter Rotation concierge.';
      } catch (e) {
        return 'An error has occurred while trying to assign the concierge.\n```' + JSON.stringify(e) + '```';
      }
    },
    clearTwirota: (event) => {
      try {
        var list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        if (list['twirota']) {
          delete list['twirota'];
          fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));
          return 'Unassigned concierge for Twitter Rotation.';
        }

        return 'There is currently no one assigned to Twitter Rotation. Nothing changed.';
      } catch (e) {
        return 'An error has occurred while trying to unassign the Twitter Rotation.\n```' + JSON.stringify(e) + '```';
      }
    },
    help: (event) => {
      const helpMessage = "Here\'s what I can do:\n- Use `@twirota who` to check who is currently assigned for Twitter Rotation.\n- Use `@twirota assign {@username}` to assign a person to Twitter Rotation.\n- Use `@twirota message {text}` to send a direct message to the concierge on rotation.\n- Use `@twirota stop on-call` to clear the assignment.";
      return helpMessage;
    }
  };
};

module.exports = rota;
