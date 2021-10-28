const DHT = require("@hyperswarm/dht");
const node = new DHT({/*bootstrap: ['code.southcoast.ga:49737']*/});
const crypto = require("hypercore-crypto");
var b32 = require("hi-base32");
let salt = process.argv.length > 1 ? process.argv[process.argv.length - 1] : null;
if (salt == '.') salt = null;
const key = (salt && salt.length) ? crypto.data(Buffer.from(salt)) : null;
const keyPair = crypto.keyPair(key);
const PORT = process.env.PORT || 8081;
var net = require("net");

const createServer = (port, keyPair) => {
    const server = node.createServer();
    server.on("connection", function (socket) {
        console.log('connection');
        let open = { local: true, remote: true };
        var local = net.connect(port, "localhost");
        local.on('data', (d) => { socket.write(d) });
        socket.on('data', (d) => { local.write(d) });

        const remoteend = () => {
            if (open.remote) socket.end();
            open.remote = false;
        }
        const localend = () => {
            if (open.local) local.end();
            open.local = false;
        }
        local.on('error', remoteend)
        local.on('finish', remoteend)
        local.on('end', remoteend)
        socket.on('finish', localend)
        socket.on('error', localend)
        socket.on('end', localend)
    });
    console.log('listening', 'https://' + b32.encode(keyPair.publicKey).replace('====', '').toLowerCase() + '.southcoast.ga/');
    server.listen(keyPair);
}

process.stdin.resume();//so the program will not close instantly

async function exitHandler(options, exitCode) {
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) {
        await node.destroy()
        process.exit();
    }
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:false}));

createServer(PORT, keyPair);
