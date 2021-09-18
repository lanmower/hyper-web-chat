require('./utils/relay.js')
require('dotenv').config()
global.crypto = require("hypercore-crypto");
global.Packr = require("msgpackr").Packr;
global.Hyperbee = require('hyperbee');
global.SDK = require("hyper-sdk");
const express = global.express = require('express'); //runtime lib downloading/async
const socketio = global.socketio = require('socket.io');
const http = require('http');
const verify = require('./utils/verify');
const action = require('./utils/action');
const discord = require('./utils/discord')(action);

(async () => {

  const app = express();
  /*app.use(function (req, res, next) {
    res.set('Cache-control', 'public, max-age=300')
    next();
  })*/
  app.use(express.static('public'));

  const server = http.createServer(app);
  const packr = new Packr();

  const { Webhook } = require('discord-webhook-node');
  const { WebSocketServer, OPEN } = require('ws');
  const wss = new WebSocketServer({ server });
  wss.on('connection', function connection(ws) {

    const broadcast = async (room, action, args, ws) => {
      console.log('broadcast', action);
      if (action == 'message') {
        if (!args.discord && args.channel.discordWebhook) {
          const hook = new Webhook(args.channel.discordWebhook);
          hook.setUsername(args.name);
          hook.setAvatar(args.avatarImage);
          hook.send(args.body);
        }
        const data = packr.pack({ action, i: args });
        wss.clients.forEach(function each(client) {
          console.log('checking client');
          if (client.readyState === OPEN) {
            console.log('found');
            if (client.rooms && client.rooms.includes(room)) {
              console.log('sending');
              client.send(data);
            }
          }
        })
      };
    }
    const emit = async (to, action, args, ws) => {
      console.log('emit');
      console.log(args);
      if(action == 'join') {
        ws.rooms = [to]
      }
      if (action == 'message' && args.channel.discordWebhook && !args.fromDiscord) {
        const hook = new Webhook(args.channel.discordWebhook);
        hook.setUsername(args.name);
        hook.setAvatar(args.avatarImage);
        hook.send(args.body);
      }
      ws.send(packr.pack({ action, i: args }))
    };
    console.log('connection');
    ws.on('message', async function incoming(message) {
      const start = new Date().getTime();
      const out = verify.verify(message);
      console.log(out);
      const socketEmit = (to, type, args) => { emit(to, type, args, ws) };
      const socketBroadcast = (to, type, args) => { broadcast(to, type, args, ws) };
      const ret = await action(out, socketEmit, socketBroadcast);
      console.log('return', ret);
      ws.send(packr.pack({ action: out.t.a, i: ret }));
    });
    ws.on('close', () => {

    })
    ws.on('error', () => {

    })
  });
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})()
