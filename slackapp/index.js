// Import express and request modules
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

// Instantiates Express and assigns our app variable to it
const expressApp = express();
expressApp.use(bodyParser.json());
const PORT = process.env.NGROK_PORT || 8080;

// Start Express server
expressApp.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Example app listening on port " + PORT);
});

// Event subscription verification URL (returns challenge)
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
    // If it's there...

    // GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret,
    // and code we just got as query parameters.
    request({
      url: 'https://slack.com/api/oauth.access',
      qs: { 
        code: req.query.code,
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env_SLACK_CLIENT_SECRET
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
