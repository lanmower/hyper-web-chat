const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
module.exports = (action)=>{
    client.on('message', async (msg)=>{
        console.log(msg.author.id);
        if(msg.author.id == '880355945081884672') return;
        const keyPair = crypto.keyPair();
        keyPair.secretKey =new Uint8Array(keyPair.secretKey);
        keyPair.publicKey =new Uint8Array(keyPair.publicKey);
        const input = {fromDiscord:true, body:msg.content, channel:msg.channel.name, name:msg.author.username}; 
        const data = verify.sign({action:'sendMessage', input, keyPair})
        const out = verify.verify(data);
        await action(out, emit);
    })
    client.login(process.env.DISCORD_TOKEN).catch(()=>{console.log('not logged in to discord')});
}