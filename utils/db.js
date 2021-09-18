const exp = {};

const cores = [];

let sdk = null;
exp.getDB = async name => {
    if(!sdk) sdk = await SDK({ applicationName: 'hyperchat', keyEncoding: 'binary', valueEncoding:'binary' });
    if (cores[name]) return cores[name].bee;
    const core = sdk.Hypercore(name);
    await core.ready();
    const bee = new Hyperbee(core);
    await bee.ready();
    cores[name]= {bee,core};
    return bee;
}
module.exports = exp;