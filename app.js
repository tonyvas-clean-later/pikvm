console.clear()

const ExpressServer = require('./express-server');
const SocketIOServer = require('./socketio-server');

let port = process.env.PORT || 8443;
let certPath = `${__dirname}/cert.pem`;
let keyPath = `${__dirname}/key.pem`;
let publicPath = `${__dirname}/public`;

let server = new ExpressServer(port, certPath, keyPath, publicPath);
server.start().then(() => {
    console.log(`HTTPS server running at https://192.168.10.120:${port}`);

    let socket = new SocketIOServer(server);
    socket.start().then(() => {
        console.log('SocketIO server started');
    })
})