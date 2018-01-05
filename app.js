require('dotenv').config();
const RtmClient = require('@slack/client').RtmClient;
const WebClient = require('@slack/client').WebClient;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const fetch = require('isomorphic-fetch');
const CronJob = require('cron').CronJob;
const parse = require('csv-parse');
const { BEER } = require('./constants');
const TOKEN = process.env.SLACK_BOT_TOKEN || '';
const BOT_USER_ID = process.env.BOT_USER_ID || '';
const SCHEMA_URL = process.env.SCHEMA_URL;

const rtm = new RtmClient(TOKEN);
const web = new WebClient(TOKEN);
let schema = {};

fetch(SCHEMA_URL)
  .then(res => res.text())
  .then(data => {
    parse(
      data,
      { relax_column_count: true, trim: true },
      (error, parsedCsv) => {
        if (error) console.log(error);
        schema = parsedCsv;
      }
    );
  });

const job = new CronJob(
  '00 30 08 * * 1-5',
  () => {
    fetch(SCHEMA_URL)
    .then(data => {
      csv.parse(data, (error, parsedCsv) => {
        schema = parsedCsv;
      });
    });
  },
  () => {
    /* This function is executed when the job stops */
  },
  true
);

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, rtmStartData => {
  console.log(
    `Logged in as ${rtmStartData.self.name} of team ${
      rtmStartData.team.name
    }, but not yet connected to a channel`
  );
});

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  if (isBot(message.text)) {
    const msg = message.text.toLowerCase();
    if (msg.includes('sal')) {
      if (msg.includes('imorgon')) {
        const currentDate = new Date(
          new Date().getTime() + 24 * 60 * 60 * 1000
        );
        const today = currentDate.toISOString().slice(0, 10);
        const currentSchema = schema.filter(day => day[0] == today);
        if (currentSchema.length > 0) {
          rtm.sendMessage(
            `FM: ${currentSchema[0][6]}`,
            message.channel
          );
        } else {
          rtm.sendMessage(
            `Ingen lektion idag!`,
            message.channel
          );
        }
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const currentSchema = schema.filter(day => day[0] == today);
        if (currentSchema.length > 0) {
          rtm.sendMessage(
            `${currentSchema[0][6]}`,
            message.channel
          );
        }  else {
          rtm.sendMessage(
            `Ingen lektion idag!`,
            message.channel
          );
        }
      }
    }
    if (msg.includes('xkcd')) {
      const rand = Math.floor(Math.random() * 500) + 1;
      fetch(`https://xkcd.com/${rand}/info.0.json`)
        .then(res => res.json())
        .then(data => {
          const attachments = [
            {
              fallback: `${data.title}`,
              color: '#1DB954',
              title: `${data.title}`,
              title_link: `https://xkcd.com/${data.num}`,
              text: `${data.alt}`,
              image_url: `${data.img}`,
              footer: 'xkcd'
            }
          ];
          web.chat.postMessage(
            message.channel,
            '',
            { attachments, as_user: true },
            (error, response) => {
              if (error) console.log(error);
            }
          );
        });
    }

    //weather
    if (msg.includes('weather') || msg.includes('väder')) {
      fetch(
        `https://api.darksky.net/forecast/3dfa4aa6d1f73a47e4c5993b7992fa7f/59.3293,18.0686?lang=sv&units=auto`
      )
        .then(res => res.json())
        .then(data => {
          rtm.sendMessage(data.daily.summary, message.channel);
        });
    }

    //BEER
    const beerExists = BEER.map(item => msg.search(item)).filter(
      beer => beer >= 0
    );
    if (beerExists.length > 0) {
      rtm.sendMessage(
        `Självklart <@${
          message.user
        }>! Varför ta ansvar när man kan ta en öl (eller ett alkoholfritt alternativ)! :beers:`,
        message.channel
      );
    }
  }
});

rtm.start();

function isBot(text) {
  return text && text.includes(BOT_USER_ID);
}
