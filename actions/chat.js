/* global api */
const actions = {
  setProfile: async input => {
    const db = await api.getDB("profile");
    const key = api.input.k;
    await db.put(key, JSON.stringify(input));
    return "saved";
  },
  getProfile: async input => {
    try {
      const db = await api.getDB("profile");
      const key = api.input.k;
      const out = JSON.parse((await db.get(key)).value);
      return out;
    } catch (e) {
      return null;
    }
  },
  getProfiles: async input => {
    return new Promise(async res=>{
      const db = await api.getDB("profile");
      const read = db.createReadStream();
      const out = [];
      read.on('data', (data)=>{
        try {
          out.push(JSON.parse(data.value));
        }catch(e) {}
      });
      read.on('end', ()=>{
        res(out)
      })
      return out;
    })
  },
  sendMessage: async input => {
    console.log(input)
    const channel = await api.getDB('channel-'+input.channel);
    const profiles = await api.getDB("profile");
    const key = api.input.k;
    const loaded = await profiles.get(key);
    let name = input.name;
    if(loaded && loaded.value) {
      name = JSON.parse(loaded.value).name;
    }
    const chanData = JSON.stringify({name,key,time:api.time,body:input.body});
    await channel.put(api.time.toString(), chanData);
    await api.emit(input.channel, 'message', {channel:input.channel,name,key,time:new Date().getTime(),body:input.body, discord:input.discord});
    return "saved";
  },
  getMessages: input => {
    return new Promise(async res=>{
      const channel = await api.getDB('channel-'+input);
      const history = channel.createHistoryStream({limit:100});
      const out = [];
      history.on('data', (data)=>{
        try {
          out.push(JSON.parse(data.value));
        }catch(e) {}
      });
      history.on('end', async ()=>{
        await api.emit(input, 'join')
        res({channel:input, messages:out.reverse()})
      })
    })
  },
  getChannels: async input => {
    return new Promise(async res=>{
      const db = await api.getDB("channel");
      const read = db.createReadStream();
      const out = [];
      read.on('data', (data)=>{
        try {
          out.push(JSON.parse(data.value));
        }catch(e) {}
      });
      read.on('end', ()=>{
        res(out)
      })
      return out;
    })
  },  
  setChannel: async input => {
    const db = await api.getDB("channel");
    const doc = {name:input, createdAt:new Date()};
    const json = JSON.stringify(doc);
    const hash = api.crypto.data(new Uint8Array(Buffer.from(input)));
    await db.put(hash, json);
    return "saved";
  }
};
