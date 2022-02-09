async function sendMessage(input) {
  let db;
  const {fromDiscord, body, images, avatar} = input;
  if(fromDiscord)  db = await api.getDB("discord");
  else  db = await api.getDB("channel");
  const channelId = input.channelId;
  if(channelId.length == 0){
    throw Error("Cannot send a message without a channel id. Please enter into a channel before sending a message.")
  } 
  const channel = await db.get(channelId); 
  console.log('sending to', {channel});
  const messages = await api.getDB(channel.id+'-channel');
  const profiles = await api.getDB("profile");
  const key = api.input.k;
  const profile = await profiles.get(key);
  const time = new Date().getTime();
  let name = input.name;
  if(profile) {
    name = profile.name;
  }
  const chanData = {name,key:key.toString('hex'),time:api.time,body:input.body, images, avatar};
  const msgid = api.time.toString();
  await messages.put(msgid, chanData);
  const output = { channel,name,key,time,body,fromDiscord, images, avatar }
  await api.broadcast(output.channel.id, 'message', output);
}

async function getHistory(channelId, db) {
  await api.emit(channelId, 'join')
  const messages = await db.createReadStream();
  return {channelId, messages}
}

async function getItems(input, db) {
  return await db.createReadStream();
}

async function getItem(key, db) {
  const out = await db.get(key);
  return out;
}

async function removeItem(id, db) {
  const createdAt = new Date().getTime();
  return await db.del(id); 
}

async function setItem(item, db) {
  item.createdAt = new Date().getTime();
  item.id = item.id||api.crypto.randomBytes(16).toString('hex');
  console.log('SET',{item});
  return await db.put(item.id, item); 
}

const actions = { 
  setProfile:async (input)=>{
    input.id = api.input.k.toString('hex');//user id
    return setItem(input, await api.getDB('profile'))
  }, 
  sendMessage, 
  async getProfile(input){return await getItem(api.input.k, await api.getDB('profile'))}, 
  async getProfiles(input){return getItems(input, await api.getDB('profile'))}, 
  async getMessages(channelId){return getHistory(channelId, await api.getDB(channelId.toString()+'-channel'))}, 
  async getChannels(input){return getItems(input, await api.getDB('channel'))},
  async setChannel(channel){
    if(channel.discordId) {
      channel.discordId = channel.discordId;
      const discordDb = await api.getDB('discord');
      await discordDb.put(channel.discordId, channel); 
    }
    const out = await setItem(channel, await api.getDB('channel'));
    return out;
  },
  async getChannel(input){return getItem(input, await api.getDB('discord'))},
  async removeChannel(input){return removeItem(input, await api.getDB('discord'))}, 
  async getRoles(input){return getItems(input, await api.getDB('role'))}, 
  async setRole(input){return setItem(input, await api.getDB('role'))},
  async getRole(input){return getItem(input, await api.getDB('role'))},
  async removeRole(input){return removeItem(input,await api.getDB('role'))}, 
  async getPermissions(input){return getItems(input, await api.getDB('permission'))}, 
  async setPermission(input){return setItem(input, await api.getDB('permission'))},
  async getPermission(input){return getItem(input, await api.getDB('permission'))},
  async removePermission(input){return removeItem(input,await api.getDB('permission'))}, 
};
