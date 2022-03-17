api.addAction("setMessage", async (message) => {
  message.time = api.time;
  let profiledb = await api.getDB("profile");
  const profile = await profiledb.get(api.userId);
  Object.assign(message, profile);
  let channeldb = message.fromDiscord?await api.getDB("discord"):await api.getDB("channel");
  const channel = await channeldb.get(message.channelId);
  const messages = await api.getDB(channel.id + "-channel");
  await messages.set(api.time.toString(), message);
  message.channel = channel;
  await api.broadcast(channel.id+'-channel', "message", message);
});

api.addAction("historyMessage", async (input) => (api.model.history(input.opts, input.id.toString()+'-channel')||{}));

api.initModels(
  [
    
    {name:"role"},
    {name:"permission"},
    {
      name:"channel",
      indexes:[
        {key:'id',db:'channel'},
        {key:'discordId', db:'discord'}
      ]
    },
    {
      name:"profile", 
      actions:["find", "get", "set"],
      hooks:{
        'beforeGet':input=>{return api.userId},
        'beforeSet':input=>{input.id = api.userId; return input}
      }
    }
  ]
);
