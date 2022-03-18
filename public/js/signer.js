window.packr = new msgpackr.Packr({ structuredClone: true });
const C = {
  CONTRACT: 'c',
  ACTION: 'a',
  PARAMETERS: 'p',
  TRANSACTION: 't',
  KEYS: 'k',
  SIGNATURE: 's',
  PUBLICKEY: 'k',
  ID:'i'
};
window.sign = (from) => {
  const tx = {};
  tx[C.ACTION] = from.action;
  tx[C.PARAMETERS] = from.parameters;
  tx[C.ID] = from.id;
  const keyUint8Array = new Uint8Array(Buffer.from(from.keyPair.secretKey, "hex"));
  const packed = packr.pack(tx);
  const out = {};
  out[C.TRANSACTION] = new Uint8Array(packed);
  out[C.SIGNATURE] = nacl.sign.detached(out[C.TRANSACTION], keyUint8Array);
  out[C.PUBLICKEY] = new Uint8Array(Buffer.from(from.keyPair.publicKey, "hex"));
  return packr.pack(out);
};
