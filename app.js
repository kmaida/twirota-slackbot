// Require the Bolt package (github.com/slackapi/bolt)
require('dotenv').config();
const { App } = require('@slack/bolt');
const fs = require('fs');
const dirname = require('path').dirname;
const rotaFile = dirname(__dirname) + '/rotations.json';
// Router
const express = require('express');
const router = express.Router();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

/* BOT FUNCTIONALITY */

// Routes
router.post('/rota-bot', (req, res) => {
  console.log(req);
  res.send(req.challenge);
});

// Serve app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
