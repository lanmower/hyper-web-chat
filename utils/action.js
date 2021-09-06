/* global SDK, Hyperbee */
const { NodeVM, VMScript } = require("vm2");
const fs = require("fs");
const vm = new NodeVM({ timeout: 1000 });

const parseSrc = src => {
  if (!src) src = {};
  let codetext = `RegExp.prototype.constructor=function(){},RegExp.prototype.exec=function(){},RegExp.prototype.test=function(){};${src}; module.exports = (async ()=>{return actions[api.input['${
    "transaction"[0]
  }']['${"action"[0]}']](api.input['${"transaction"[0]}']['${"input"[0]}']);})().catch(console.error)`;
  return new VMScript(codetext);
};

const actions = {
  chat: parseSrc(fs.readFileSync(`actions/chat.js`))
};

const cores = [];
module.exports = async (input, em, socket) => {
  const sdk = await SDK({applicationName:'hyperchat'});
  const api = {
    getDB: async name => {
      console.log("getting db");
      if (cores[name]) return cores[name].bee;
      const core = sdk.Hypercore(name);
      await core.ready();
      const created = (cores[name] = {
        bee: new Hyperbee(core),
        length: core.length
      });
      await created.bee.ready();
      console.log("got db");

      return created.bee;
    },
    input,
    crypto,
    emit:(to, type, args)=>{
      console.log('emit', {to, type, args})
      em(to, type, args, socket)
    }
  };
  vm._context.api = api;
  vm._context.console = console;
  return await vm.run(actions["chat"]);
};
