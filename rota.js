const fs = require('fs');
const dirname = require('path').dirname;
const rotaFile = dirname(__dirname) + '/rotations.json';

const rota = (context) => {
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
    callTwirota: function (req, res) {
      try {
        const list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        if (!list['twirota']) {
          return res.text('No Twitter Rotation assigned. Use `@twirota assign {@username}`').send();
        }

        const link = `https://${process.env.SLACK_TEAM}.slack.com/archives/${req.channel.name}/p${req.message.timestamp.replace('.', '')}`;
        const conciergeMessage = `@${req.from.name} needs your attention in #${req.channel.name} (${link}) \n\n*Message*:\n`;
        res.text(conciergeMessage + req.message.value.text, list['twirota']);

        return res.text('A message has been sent to the Twitter Rotation concierge. If your message is urgent and you don\'t receive a reply, please use `@here` or `@channel`.').send();
      } catch (e) {
        return res.text('An error has occurred while trying to contact the concierge.\n```' + JSON.stringify(e) + '```').send();
      }
    },
    whosTwirota: function (req, res) {
      try {
        const list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        const conciergeName = list['twirota'];
        if (conciergeName) {
          return res.text('The Twitter Rotation concierge is `' + conciergeName + '`. To send a direct message to the Twitter Rotation concierge use `@twirota message: {text}`').send();
        }
        return res.text('No Twitter Rotation concierge is currently assigned.').send();
      } catch (e) {
        return res.text('An error has occurred while trying to assign the concierge.\n```' + JSON.stringify(e) + '```').send();
      }
    },
    assignTwirota: function (req, res) {
      try {
        const list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        const name = req.params.name;
        if (name.charAt(0) !== '@') {
          name = '@' + name;
        }

        list['twirota'] = name;
        fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));
        return res.text('User ' + name + ' has been assigned Twitter Rotation concierge.').send();
      } catch (e) {
        return res.text('An error has occurred while trying to assign the concierge.\n```' + JSON.stringify(e) + '```').send();
      }
    },
    clearTwirota: function (req, res) {
      try {
        var list = fs.readFileSync(rotaFile);
        list = JSON.parse(list);

        if (list['twirota']) {
          delete list['twirota'];
          fs.writeFileSync(rotaFile, JSON.stringify(list, null, 2));
          return res.text('Unassigned concierge for Twitter Rotation.').send();
        }

        return res.text('There is currently no one assigned to Twitter Rotation. Nothing changed.').send();
      } catch (e) {
        return res.text('An error has occurred while trying to unassign the Twitter Rotation.\n```' + JSON.stringify(e) + '```').send();
      }
    },
    help: function (req, res) {
      var helpMessage = "Here\'s what I can do:\n- Use `@twirota who` to check who is currently assigned for Twitter Rotation.\n- Use `@twirota assign {@username}` to assign a person to Twitter Rotation.\n- Use `@twirota message {text}` to send a direct message to the concierge on rotation.\n- Use `@twirota stop on-call` to clear the assignment.";
      return res.text(helpMessage).send();
    }
  };
};

module.exports = rota;
