window.packr = new msgpackr.Packr({ structuredClone: true });
const C = {
  CONTRACT: 'c',
  ACTION: 'a',
  INPUT: 'i',
  TRANSACTION: 't',
  KEYS: 'k',
  SIGNATURE: 's',
  PUBLICKEY: 'k'
};
window.sign = (from) => {
  const tx = {};
  tx[C.ACTION] = from.action;
  tx[C.INPUT] = from.input;
  const keyUint8Array = new Uint8Array(Buffer.from(from.keyPair.secretKey, "hex"));
  const packed = packr.pack(tx);
  const out = {};
  out[C.TRANSACTION] = new Uint8Array(packed);
  out[C.SIGNATURE] = nacl.sign.detached(out[C.TRANSACTION], keyUint8Array);
  out[C.PUBLICKEY] = new Uint8Array(Buffer.from(from.keyPair.publicKey, "hex"));
  return packr.pack(out);
};
