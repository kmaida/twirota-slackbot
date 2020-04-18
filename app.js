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

// Serve Bolt app
(async () => {
  await app.start(process.env.BOLT_PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
