console.clear()

const ExpressServer = require('./express-server');
const SocketIOServer = require('./socketio-server');
const VideoStream = require('./video-stream');

const DEFAULT_HTTPS_PORT = 8443;
const DEFAULT_STREAM_PORT = 8080;

const HTTPS_CERT_PATH = `${__dirname}/cert.pem`;
const HTTPS_KEY_PATH = `${__dirname}/key.pem`;
const HTTPS_PUBLIC = `${__dirname}/public`;

const MJPG_STREAMER_PATH = `${__dirname}/mjpg-streamer/mjpg-streamer-experimental`;
const STREAM_RESOLUTION = '1920x1080';
const STREAM_FRAMERATE = '30';

let httpsPort = process.env.HTTPS_PORT || DEFAULT_HTTPS_PORT;
let streamPort = process.env.STREAM_PORT || DEFAULT_STREAM_PORT;

let server = new ExpressServer(httpsPort, HTTPS_PUBLIC, HTTPS_CERT_PATH, HTTPS_KEY_PATH);
server.start().then(() => {
    console.log(`HTTPS server running at https://192.168.10.120:${httpsPort}`);

    let socket = new SocketIOServer(server);
    socket.start().then(() => {
        console.log('SocketIO server started');

        let stream = new VideoStream(streamPort, MJPG_STREAMER_PATH, STREAM_RESOLUTION, STREAM_FRAMERATE);
        stream.onStderr = (stderr) => {
            console.error('stderr', stderr.toString());
        }

        stream.onStdout = (stdout) => {
            console.log('stdout', stdout.toString());
        }

        stream.onExit = (code, signal) => {
            console.log('exit', code, signal);
        }

        stream.onFrame = (frame) => {
            // console.log('frame', frame);
            socket.io.emit('stream', frame);
        }

        stream.start(() => {
            console.log('Stream started!');
        })
    }).catch(console.error)
}).catch(console.error)