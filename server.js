require('./relay.js')
require('dotenv').config()
global.crypto = require("hypercore-crypto");
global.Packr = require("msgpackr").Packr;
global.Hyperbee = require('hyperbee');
global.SDK = require("hyper-sdk");
const express = global.express = require('express'); //runtime lib downloading/async
const socketio = global.socketio = require('socket.io');
const http = require('http');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.once('ready', () => {
	console.log('Ready!');
});   
client.login(process.env.DISCORD_TOKEN).catch(()=>{console.log('not logged in to discord')});


(async () => {
  const verify = require('./utils/verify');
  const action = require('./utils/action');
  client.on('message', async (msg)=>{
    console.log(msg.author.id);
    if(msg.author.id == '880355945081884672') return;
    const keyPair = crypto.keyPair();
    keyPair.secretKey =new Uint8Array(keyPair.secretKey);
    keyPair.publicKey =new Uint8Array(keyPair.publicKey); 
    const data = verify.sign({action:'sendMessage', input:{discord:true, body:msg.content, channel:msg.channel.name, name:msg.author.username}, keyPair})
    const out = verify.verify(data);
    await action(out, emit);
  })

  const app = express();
  app.use(function (req, res, next) {
//    res.set('Cache-control', 'public, max-age=300')
    next();
  })
  app.use(express.static('public'));

  const server = http.createServer(app);
  const io = socketio(server);

  const { Webhook } = require('discord-webhook-node');
  
  const emit = async (to, type, args, socket) => { 
    if(type == 'join') {
      socket.join(to);
    }
    if(type == 'message' && !args.discord) {
      const hook = new Webhook("https://ptb.discord.com/api/webhooks/880355945081884672/nHXVX4OUKEky8c5-aHdr-DmbZue5c3PkemVTE2kc8esVP3nYYeLH1jrXroQRuMTjlQYW");
      const IMAGE_URL = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
      hook.setUsername(args.name);
      hook.setAvatar(IMAGE_URL);
      hook.send(args.body);
    }
    io.to(to).emit(type, args); 
  };
  io.on('connection', socket => {
    
    socket.on('tx', async (data, ack) => {
      const start = new Date().getTime();
      const out = verify.verify(data);
      const ret = await action(out, emit, socket);
      if(typeof ack == 'function') ack(ret);
    })
  });
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  //loaded();
})()
