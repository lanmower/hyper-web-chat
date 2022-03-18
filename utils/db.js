const exp = {};

const cores = [];
const packr = new Packr();

let sdk = null;
exp.getDB = async name => {
    if(!sdk) sdk = await SDK({ applicationName: 'hyperchat' });
    if (cores[name]) return cores[name].bee;
    const core = sdk.Hypercore(name);
    const bee = new Hyperbee(core);
    const set = async (key, val) => {
        const read = Buffer.from(key, 'hex');
        await bee.put(read, packr.pack(val));
        return true;
    };
    const del = async (key) => {
        const read = Buffer.from(key, 'hex');
        await bee.del(read);
        return true;
    };
    const get = async (key) => {
        const read = Buffer.from(key, 'hex');
        try {
            const loaded = await bee.get(read);
            if (loaded) {
                const out = packr.unpack(loaded.value);
                return out;
            }
        } catch (e) {
            console.trace(e);
        }
        return null;
    };
    const createReadStream = async (opts) => {
        const task = new Promise(async res => {
            const stream = await bee.createReadStream(opts);
            const out = [];
            stream.on('data', (data) => {
                const unpacked = packr.unpack(data.value);
                if(data.value) out[data.key.toString('hex')] = unpacked;
            });
            stream.on('end', (data) => {
                res(out);
            });
        });
        return task;
    };
    const createHistoryStream = async (opts) => {
        const task = new Promise(async res => {
            const stream = await bee.createHistoryStream(opts);
            const out = [];
            stream.on('data', (data) => {
                const unpacked = packr.unpack(data.value);
                if(data.value) out.push(unpacked);
            });
            stream.on('end', (data) => {
                res(out);
            });
        });
        return task;
    };    const out = { get, set, del, createReadStream, createHistoryStream };
    cores[name]= {bee:out,core};
    return out;
}
module.exports = exp;
