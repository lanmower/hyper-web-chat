/* global api */

async function setProfile(profile) {
  const db = await api.getDB("profile");
  const key = api.input.k;
  await db.put(key, JSON.stringify(profile));
}

async function getProfile() {
  const db = await api.getDB("profile");
  const key = api.input.k;
  const out = JSON.parse( (await db.get(key)) ?.value||'' );
  return out;
}

async function getProfiles() {
  return new Promise(async res=>{
    const db = await api.getDB("profile");
    const read = db.createReadStream();
    const out = [];
    read.on('data', data=>{ out.push(JSON.parse(data?.value)) });
    read.on('end', ()=>{ res(out) })
    return out;
  })
}

async function sendMessage(input) {
  let db;
  const {fromDiscord, body} = input;
  if(fromDiscord)  db = await api.getDB("discord");
  else  db = await api.getDB("channel");
  const channelId = Buffer.from(input.channelId, fromDiscord?'utf-8':'hex');
  const channel = JSON.parse((await db.get(channelId))?.value); 
  const messages = await api.getDB(input.channelId.toString('hex')+'-channel');
  const profiles = await api.getDB("profile");
  const key = api.input.k;
  const profile = await profiles.get(key);
  const time = new Date().getTime();
  let name = input.name;
  if(profile && profile.value) {
    name = JSON.parse(profile?.value).name;
  }
  
  const chanData = JSON.stringify({name,key,time:api.time,body:input.body});
  const msgid = Buffer.from(api.time.toString(), 'utf-8');
  await messages.put(msgid, chanData);
  const output = { channel,name,key,time,body,fromDiscord }
  await api.broadcast(output.channel.id, 'message', output);
}

function getMessages(channelId) {
  return new Promise(async res=>{
    const channel = await api.getDB(channelId.toString()+'-channel');
    const history = channel.createHistoryStream({limit:100});
    const out = [];
    history.on('data', (data)=>{
      out.push(JSON.parse(data?.value));
    });
    history.on('end', async ()=>{
      await api.emit(channelId, 'join')
      res({channelId, messages:out.reverse()})
    })
  }).catch(()=>{throw e})
}

async function getPermissions(channelId) {
  const db = await api.getDB("permission");
  const roles = JSON.parse((await db.get(Buffer.from('roles', 'utf-8')))?.value);
  const permissions = JSON.parse((await db.get(Buffer.from(channelId, 'utf-8')))?.value);
  return {roles,permissions};
}

async function getChannels() {
  return new Promise(async res=>{
    const db = await api.getDB("channel");
    const read = db.createReadStream();
    const out = {};
    read.on('data', (data)=>{
      const parsed = JSON.parse(data?.value);
      if(parsed) out[parsed.id] = parsed;
    });
    read.on('end', ()=>{res(out)});
    return out;
  })
}

async function removeChannel(id) {
  console.log('remove',{id})
  const db = await api.getDB("channel");
  const createdAt = new Date().getTime();
  await db.del(Buffer.from(id, 'hex')); 
}

async function setChannel(input) {
  const db = await api.getDB("channel");
  const createdAt = new Date().getTime();
  var id = input.id||api.crypto.randomBytes(16).toString('hex');
  const doc = {name:input.name, discordWebhook:input.discordWebhook, createdAt, id};
  if(input.discordId) {
    doc.discordId = input.discordId;
    const discordDb = await api.getDB("discord");
    await discordDb.put(Buffer.from(doc.discordId, 'utf-8'), JSON.stringify(doc)); 
  }
  await db.put(Buffer.from(id, 'hex'), JSON.stringify(doc)); 
}

const actions = { 
  setProfile, 
  getProfile, 
  getProfiles, 
  sendMessage, 
  getMessages, 
  getChannels, 
  setChannel,
  removeChannel
};
