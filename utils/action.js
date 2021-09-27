/* global SDK, Hyperbee */
const { NodeVM, VMScript } = require("vm2");
const fs = require("fs");
const vm = new NodeVM({ timeout: 1000 });
const db = require('./db.js')
const sodium = require('sodium-universal')
const parseSrc = src => {
  if (!src) src = {};
  let codetext = `${src}; module.exports = (async ()=>{return actions[api.input['${"transaction"[0]}']['${"action"[0]}']](api.\
input['${"transaction"[0]}']['${"input"[0]}']);})().catch((e)=>{console.error(e, e.stack)})`;
  return new VMScript(codetext);
};

const actions = {
  chat: parseSrc(fs.readFileSync(`actions/chat.js`))
};

module.exports = async (input, emit, broadcast, socketId) => {
  const time = new Date().getTime();
  const api = {getDB:db.getDB,input,crypto,time,emit, sodium, broadcast};
  vm._context.api = api;
  vm._context.Buffer = Buffer;
  return await vm.run(actions["chat"]);
};
