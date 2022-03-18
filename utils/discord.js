const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const packr = new Packr();

const verify = require('./verify');
const imageregex = /\b(https?:\/\/\S+(?:png|jpe?g|gif)\S*)\b/ig;

module.exports = (action, emit, broadcast)=>{
    client.on('messageCreate', async (msg)=>{
        console.log(msg.author.id);
        if(msg.author.id == '880355945081884672') return;
        const keyPair = crypto.keyPair();
        keyPair.secretKey = new Uint8Array(keyPair.secretKey);
        keyPair.publicKey = new Uint8Array(keyPair.publicKey);
        const input = {fromDiscord:true, body:msg.content, channelId:msg.channel.id, name:msg.author.username, avatar:msg.author.displayAvatarURL() }; 
        if(!input.images) input.images = [];
        for (let file of msg.attachments) {
          input.images.push({url:file[1].url})
        }
        let match = msg.content.match(imageregex)||[];
        for(let x of match) input.images.push({url:x});
        const data = verify.sign({action:'setMessage', input, keyPair})
        const out = verify.verify(packr.pack(data));
        await action(msg.id, out, emit, broadcast);
    })
    client.login(process.env.DISCORD_TOKEN).catch(()=>{console.log('not logged in to discord')});
}