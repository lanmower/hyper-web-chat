/* global SDK, Hyperbee */
const { NodeVM, VMScript } = require("vm2");
const fs = require("fs");
const vm = new NodeVM({ timeout: 1000 });
const db = require("./db.js");
const sodium = require("sodium-universal");
const parseSrc = (src) => {
  if (!src) src = {};
  let codetext = `${src}; module.exports = (async ()=>{return api.actions[api.action](api.params)})().catch((e)=>{console.error(e, e.stack)})`;
  return new VMScript(codetext);
};

const app = {
  chat: parseSrc(fs.readFileSync(`actions/chat.js`)),
};

module.exports = async (id, input, emit, broadcast, socketId) => {
  const time = new Date().getTime();
  const actions = {};
  const addAction =  (name, action, beforeHook=(out)=>{console.log('BEFORE: ', name, action);return out}, afterHook=(out)=>{console.log('AFTER: ', name, action);return out}) => {
    actions[name]=async (input)=>{
      console.log('checking if allowed', name)
      //if(!await api.model.auth(name)) throw new Error('Not allowed');
      const beforeOut = await beforeHook(input, name, action);
      console.log("RUNNING", name, action, 'WITH', beforeOut);
      const actionOut = await action(beforeOut, name, action);
      return afterHook(actionOut, name, action);
    }
  };
  const api = {
    getDB: db.getDB,
    userId: input.k.toString('hex'),
    action: input.t.a,
    params: input.t.p,
    crypto,
    actions,
    time,
    emit: (to, type, args) => {
      emit(to, type, id, args);
    },
    addAction,
    sodium,
    broadcast,
    initModels: async (models) => {
      for(const {name, actions=["find", "get", "set", "remove"], indexes=[{'key':'id','db':name}], hooks={}} of models) {
        for (let action of actions) {
          const uName = name.charAt(0).toUpperCase() + name.slice(1);
          const uAction = action.charAt(0).toUpperCase() + action.slice(1);
          
          api.addAction(action + uName, (input) => {
            return api.model[action](input, name, indexes);
          }, hooks['before'+uAction], hooks['after'+uAction])
        }
      }
    },
    model: {
      find: async (input, name) => {
        const db = await api.getDB(name);
        return await db.createReadStream(input);
      },
      get: async (key, name) => {
        console.log("GET", key, name);
        const db = await api.getDB(name);
        const out = await db.get(key);
        return out;
      },
      remove: async (id, name) => {
        const db = await api.getDB(name);
        return await db.del(id);
      },
      history: async (input, name) => {
        const db = await api.getDB(name);
        await api.emit(name, "join");
        console.log("JOINED ", name);
        const messages = await db.createHistoryStream(input || { reverse: true });
        return messages;
      },
      set: async (item, name, indexes=[{key:'id',db:'profile'}]) => {
        const db = await api.getDB(name);
        item.createdAt = new Date().getTime();
        item.id = item.id || api.crypto.randomBytes(16).toString("hex");
        console.log('set', name, indexes);
        for(const config of indexes) {
          if (item[config.key]) {
            const indexDb = await api.getDB(config.db);
            await indexDb.set(item[config.key], item);
          }
        }
        return item.id;
      },
      auth: async (name, zoneId='') => {
        console.log({zoneId});
        let roles = await api.model.get("userrole", api.userId);
        if(!roles) roles = {forUser:['everyone']};
        else roles.push({forUser:['everyone']});
        for (const roleId of roles.forUser) {
          const permissions = api.model.get("permission", zoneId+roleId);
          if (permissions[name] === "on") {
            return true;c
          }
        }
      },
    }
  };
  vm._context.api = api;
  vm._context.Buffer = Buffer;

  const out = await vm.run(app["chat"]);
  return out||api.i;
};

