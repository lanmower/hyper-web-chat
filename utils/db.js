const exp = {};

const cores = [];

let sdkcache = null;
exp.getDB = async name => {
    const sdk = sdkcache || (sdkcache = await SDK({ applicationName: 'hyperchat' }));
    if (cores[name]) return cores[name].bee;
    const core = sdk.Hypercore(name);
    await core.ready();
    const created = (cores[name] = {
        bee: new Hyperbee(core),
        length: core.length
    });
    await created.bee.ready();
    return created.bee;
}
module.exports = exp;