// server.js
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

// Server Setup
const expressApp = express();
expressApp.use(bodyParser.json());
const PORT = process.env.SERVER_PORT || 8080;

expressApp.listen(PORT, function() {
  console.log(`Listening on port ${PORT}`);
});

// Event subscription verification route (returns challenge)
expressApp.post('/rota-bot', (req, res) => {
  res.send(req.body.challenge);
});

// Handles GET request to /oauth endpoint
// For handling logic of the Slack OAuth process
expressApp.get('/oauth', function (req, res) {
  // When user authorizes an app, a code query parameter is passed on OAuth endpoint.
  // If that code is not there, respond with error message
  if (!req.query.code) {
    res.status(500);
    res.send({ "Error": "Looks like we're not getting code." });
    console.log("Looks like we're not getting code.");
  } else {
    // GET call to Slack's `oauth.access` endpoint, 
    // passing our app's client ID, client secret,
    // and code as query parameters.
    request({
      url: 'https://slack.com/api/oauth.access',
      qs: { 
        code: req.query.code,
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET
      },
      method: 'GET',
    }, function (error, response, body) {
      if (error) {
        console.log(error);
      } else {
        res.json(body);
      }
    })
  }
});

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
expressApp.post('/command', (req, res) => {
  res.send('Your ngrok tunnel is up and running!');
});
