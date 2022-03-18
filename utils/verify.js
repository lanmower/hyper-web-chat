const packr = new Packr();
const create = (from) => {
    const tx = {};
    tx['action'[0]] = from.action;
    tx['parameters'[0]] = from.input;
    const out = {};
    out['transaction'[0]] = tx;
    out['keys'[0]] = from.keyPair;
    return sign(out);
};
const verify = (message) => {
      try {
            const input = packr.unpack(message);
            const verified = crypto.verify(
              input['transaction'[0]],
              input['signature'[0]],
              input['key'[0]]
            );
            if (!verified) throw new Error("could not verify transaction");
            input['transaction'[0]] = packr.unpack(input['transaction'[0]]);
            return input;
      } catch(e) {
            return false;
            console.trace(e);
      }
};
const sign = (input) => {
      const out = {};
      const tx = packr.pack(input['transaction'[0]]);
      out['transaction'[0]] = tx;
      out['signature'[0]] = crypto.sign(tx, input['keys'[0]].secretKey);
      out['key'[0]] = input['keys'[0]].publicKey;
      return out;
};
module.exports = { verify, sign:create };
