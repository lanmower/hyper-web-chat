/* global api */


async function sendMessage(input) {
  let db;
  const {fromDiscord, body} = input;
  if(fromDiscord)  db = await api.getDB("discord");
  else  db = await api.getDB("channel");
  const channelId = Buffer.from(input.channelId, fromDiscord?'utf-8':'hex');
  if(channelId.length == 0){
    throw Error("Cannot send a message without a channel id. Please enter into a channel before sending a message.")
  } 
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

function getHistory(channelId, dbName) {
  return new Promise(async res=>{
    const channel = await api.getDB(dbName);
    const history = channel.createReadStream({limit:100});
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

async function getItems(input, dbName) {
  return new Promise(async res=>{
    const db = await api.getDB(dbName);
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

async function getItem(key, dbName) {
  const db = await api.getDB(dbName);
  console.log('get', key, dbName);
  const out = JSON.parse( (await db.get(key)) ?.value||'' );
  return out;
}

async function removeItem(id, dbName) {
  console.log('remove',{id})
  const db = await api.getDB(dbName);
  const createdAt = new Date().getTime();
  return await db.del(Buffer.from(id, 'hex')); 
}

async function setItem(item, dbName) {
  const db = await api.getDB(dbName);
  item.createdAt = new Date().getTime();
  item.id = item.id||api.crypto.randomBytes(16).toString('hex');
  await db.put(Buffer.from(item.id, 'hex'), JSON.stringify(item)); 
}

const actions = { 
  setProfile:(input)=>{input.id = api.input.k; return setItem(input, 'profile')}, 
  sendMessage, 
  getProfile(input){return getItem(api.input.k, 'profile')}, 
  getProfiles(input){return getItems(input, 'profile')}, 
  getMessages(channelId){return getHistory(channelId, channelId.toString()+'-channel')}, 
  getChannels(input){return getItems(input, 'channel')},
  async setChannel(channel){
    const out = await setItem(channel, 'channel');
    if(channel.discordId) {
      doc.discordId = channel.discordId;
      const discordDb = await api.getDB("discord");
      await discordDb.put(Buffer.from(doc.discordId, 'utf-8'), JSON.stringify(doc)); 
    }
    return out;
  },
  getChannel(input){return getItem(input, 'channel')},
  removeChannel(input){return removeItem(input,'channel')}, 
  getRoles(input){return getItems(input, 'role')}, 
  setRole(input){return setItem(input, 'role')},
  getRole(input){return getItem(input, 'role')},
  removeRole(input){return removeItem(input,'role')}, 
  getPermissions(input){return getItems(input, 'permission')}, 
  setPermission(input){return setItem(input, 'permission')},
  getPermission(input){return getItem(input, 'permission')},
  removePermission(input){return removeItem(input,'permission')}, 
};
