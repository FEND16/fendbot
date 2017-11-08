require('dotenv').config();
const RtmClient = require('@slack/client').RtmClient;
const WebClient = require('@slack/client').WebClient;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const fetch = require('isomorphic-fetch');
const CronJob = require('cron').CronJob;
const parse = require('csv-parse');
const { BEER } = require('./constants');
const token = process.env.SLACK_BOT_TOKEN || '';

const rtm = new RtmClient(token);
const web = new WebClient(token);
var schema = {};

fetch(`https://se.timeedit.net/web/nackademin/db1/1/ri105v5y1550Z6QY50Q3QYgXZQ0203Y1757.csv`)
  .then(res => res.text())
  .then(data => {
    console.log(data);
    parse(data, (error, parsedCsv) => {
      schema = parsedCsv;
      console.log(schema);
  })
})

const job = new CronJob('00 30 08 * * 1-5', () => {
  fetch(`https://se.timeedit.net/web/nackademin/db1/1/ri105v5y1550Z6QY50Q3QYgXZQ0203Y1757.csv`)
    .then(data => {
      csv.parse(data, (error, parsedCsv) => {
        schema = parsedCsv;
        console.log(schema);
      })
    })
  }, () => {
    /* This function is executed when the job stops */
  },
  true
);


rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});


rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log(message);
  //Check if bot is being called
  if(isBot(message.text)){
    
    const msg = message.text.toLowerCase();
    
    //XKCD
    if(msg.includes("xkcd")){
      const rand = Math.floor(Math.random() * 500) + 1        
      fetch(`https://xkcd.com/${rand}/info.0.json`)
        .then(res => res.json())
        .then(data => {
          const attachments = [
            {
              "fallback": `${data.title}`,
              "color": "#1DB954",
              "title": `${data.title}`,
              "title_link": `https://xkcd.com/${data.num}`,
              "text": `${data.alt}`,
              "image_url": `${data.img}`,
              "footer": "xkcd"
            }
          ];
          web.chat.postMessage(message.channel, "", { attachments, as_user: true }, (error, response) => {
            if(error) console.log(error)
            console.log(response);
          } );
        })
    }

    //weather
    if(msg.includes("weather") || msg.includes("väder")){
      fetch(`https://api.darksky.net/forecast/3dfa4aa6d1f73a47e4c5993b7992fa7f/59.3293,18.0686?lang=sv&units=auto`)
        .then(res => res.json())
        .then(data => {
          rtm.sendMessage(data.daily.summary, message.channel);
        })
    }

    //BEER
    const beerExists = BEER.map(item => msg.search(item)).filter(beer => beer >= 0);
    if(beerExists.length > 0){
        rtm.sendMessage(`Självklart <@${message.user}>! Varför ta ansvar när man kan ta en öl (eller ett alkoholfritt alternativ)! :beers:`, message.channel);
        //rtm.sendMessage(`Nejdu <@${message.user}>, ta en fika istället! :coffee:`, message.channel);
      
    }
  }
});

rtm.start();


function isBot(text){
  return (text && text.includes("U7WJ8CWC9"))
}