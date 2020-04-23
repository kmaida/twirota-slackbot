# Twirota

Twirota is a simple **Twi**tter **rota**tion concierge Slackbot I wrote for internal team use at [Gatsby](https://gatsbyjs.com). The inspiration was derived from my time working at [Auth0](https://auth0.com) and using Auth0's extremely useful concierge Slackbot.

## Usage

* `@twirota assign [@user]` assigns someone to the Twitter rotation
* `@twirota clear` removes the current assignment
* `@twirota who` reports the name of the currently assigned concierge
* `@twirota help` shows the list of available commands
* `@twirota [some other message]` sends a direct message to the concierge, notifying them of your message that needs attention

## Development

**Prerequisite**: A Slack workspace that you can test in (without disturbing or spamming your coworkers 😛). You can [create a new Slack workspace for free here](https://slack.com/get-started#/create).

1. [Create a new Slack app](https://api.slack.com/apps/new).
2. Name your app `Twirota` and select your preferred development Slack workspace.
3. Clone this repository locally.
4. If it does not exist, create a `rotations.json` file with `{}` as the contents in your project's root directory.
5. Rename the `.env_sample` file to `.env` and add the appropriate configuration.

## Installation
