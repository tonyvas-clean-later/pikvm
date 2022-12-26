console.clear()

// Server wrapper classes
const ExpressServer = require('./express-server');
const SocketIOServer = require('./socketio-server');
const VideoStream = require('./video-stream');

// Default ports to use if not specified by env
const DEFAULT_HTTPS_PORT = 8443;
const DEFAULT_STREAM_PORT = 8080;

// HTTPS files
const HTTPS_CERT_PATH = `${__dirname}/cert.pem`;
const HTTPS_KEY_PATH = `${__dirname}/key.pem`;
const HTTPS_PUBLIC = `${__dirname}/public`;

// Streamer files and options
const MJPG_STREAMER_PATH = `${__dirname}/mjpg-streamer/mjpg-streamer-experimental`;
const STREAM_RESOLUTION = '1920x1080';
const STREAM_FRAMERATE = '30';

// Get ports from env if set, if not use defaults
let httpsPort = process.env.HTTPS_PORT || DEFAULT_HTTPS_PORT;
let streamPort = process.env.STREAM_PORT || DEFAULT_STREAM_PORT;

// Start express server
let server = new ExpressServer(httpsPort, HTTPS_PUBLIC, HTTPS_CERT_PATH, HTTPS_KEY_PATH);
server.start().then(() => {
    console.log(`HTTPS server running at https://192.168.10.120:${httpsPort}`);

    // Start socketio server using express server
    let socket = new SocketIOServer(server);
    socket.start().then(() => {
        console.log('SocketIO server started');

        // Start mjpg-streamer server
        let stream = new VideoStream(streamPort, MJPG_STREAMER_PATH, STREAM_RESOLUTION, STREAM_FRAMERATE);

        // Attach stderr, stdout and exit listeners
        stream.onStderr = (stderr) => {
            console.error('stderr', stderr.toString());
        }

        stream.onStdout = (stdout) => {
            console.log('stdout', stdout.toString());
        }

        stream.onExit = (code, signal) => {
            console.log('exit', code, signal);
        }

        // Attach listener for frame ready event
        stream.onFrame = (frame) => {
            // Send frame data to socket clients
            socket.io.emit('stream', frame);
        }

        // Start streamer server
        stream.start(() => {
            console.log('Stream started!');
        })
    }).catch(console.error)
}).catch(console.error)