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
const fs = require('fs');
(async () => {

  const app = express();

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
        const avatar = args.avatar||`https://avatars.dicebear.com/api/pixel-art-neutral/${args.name}.png`;
        console.log({avatar, args})
        hook.setAvatar(avatar);
        console.log(args);
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
    var debounce = require('debounce');
    /*fs.watch('public', debounce((eventType, filename) => {
      const data = packr.pack({ action: 'refresh', i: {} })
      wss.clients.forEach(function each(client) {
        if (client.readyState === OPEN) {
          client.send(data);
        }
        client.close();
      })
      }, 1000));*/


    ws.on('message', async function incoming(message) {
      try {
        const out = verify.verify(message);
        if(!out.t || !out.k) return false;
        if(!sockets[out.k]) sockets[out.k] = [];
        key = out.k;
        if(!sockets[key]) sockets[key] = [];
        sockets[key].push(socketId);
        const socketEmit = (to, type, args) => { emit(to, type, args, ws) };
        emit(out.k, 'join', {}, ws);
        const socketBroadcast = (to, type, args) => { broadcast(to, type, args, ws) };
        const ret = await action(out, socketEmit, socketBroadcast, socketId);

        await ws.send(packr.pack({ action: out.t.a, i: ret }));
      } catch(e) {
        console.trace(e);
      }
    });
    ws.on('close', () => {
        if(sockets[key] && sockets[key].includes(socketId)) sockets[key] = sockets[key].filter(a=>a!=socketId)
    })
    ws.on('error', () => {
        if(sockets[key] && sockets[key].includes(socketId)) sockets[key] = sockets[key].filter(a=>a!=socketId)
    })
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  var b32 = require("hi-base32");
  console.log(
    "listening",
    b32
      .encode(
        require("hyper-relay")().serve(
          "chatbitch",
          "3000",
          false,
          "127.0.0.1"
        )
      )
      .replace("====", "")
      .toLowerCase()
  );
  console.log(
    "listening",
    b32
      .encode(
        require("hyper-relay")().serve(
          "chatbitch-liverload",
          "35729",
          false,
          "127.0.0.1"
        )
      )
      .replace("====", "")
      .toLowerCase()
  );
})()
