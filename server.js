require('dotenv').config()
global.crypto = require("hypercore-crypto");
global.Packr = require("msgpackr").Packr;
global.Hyperbee = require('hyperbee');
global.SDK = require("hyper-sdk");
const express = global.express = require('express'); //runtime lib downloading/async
global.socketio = require('socket.io');
const http = require('http');
const verify = require('./utils/verify');
const action = require('./utils/action');
const discord = require('./utils/discord');

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

  const broadcast = async (room, action, args) => {
    if (action == 'message') {
      if (!args.fromDiscord && args.channel.discordWebhook) {
        const hook = new Webhook(args.channel.discordWebhook);
        hook.setUsername(args.name);
        hook.setAvatar(args.avatarImage);
        hook.send(args.body);
      }
      const data = packr.pack({ action, i: args })
      wss.clients.forEach(function each(client) {
        if (client.readyState === OPEN) {
          if (client.rooms && client.rooms.includes(room)) {
            client.send(data);
          }
        }
      })
    };
  }

  discord(action, ()=>{}, broadcast);
  const sockets = {};
  wss.on('connection', function connection(ws) {
    console.log('connection')
    const socketId = crypto.randomBytes(32).toString('hex');
    ws.rooms = [];
    let key = null;
    const emit = async (to, action, args, ws) => {
      if(action == 'join') {
        if(!ws.rooms.includes(to)) ws.rooms.push(to)
      } else {
        ws.send(packr.pack({ action, i: args }))
      }
    };
    ws.on('message', async function incoming(message) {
      const out = verify.verify(message);
      if(!sockets[out.k]) sockets[out.k] = [];
      key = out.k;
      if(!sockets[key]) sockets[key] = [];
      sockets[key].push(socketId);
      const socketEmit = (to, type, args) => { emit(to, type, args, ws) };
      emit(out.k, 'join', {}, ws);
      const socketBroadcast = (to, type, args) => { broadcast(to, type, args, ws) };
      const ret = await action(out, socketEmit, socketBroadcast, socketId);
      ws.send(packr.pack({ action: out.t.a, i: ret }));
    });
    ws.on('close', () => {
        if(sockets[key] && sockets[key].includes(socketId)) sockets[key] = sockets[key].filter(a=>a!=socketId)
    })
    ws.on('error', () => {
        if(sockets[key] && sockets[key].includes(socketId)) sockets[key] = sockets[key].filter(a=>a!=socketId)
    })
  });
  const PORT = process.env.PORT || 8081;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  var b32 = require("hi-base32");
  console.log(
    "listening",
    b32
      .encode(
        require("hyper-relay")().serve(
          "schoolofminnowsbitch",
          "3000",
          false,
          "127.0.0.1"
        )
      )
      .replace("====", "")
      .toLowerCase()
  );
})()
