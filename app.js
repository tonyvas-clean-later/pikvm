console.clear()

// Server wrapper classes
const ExpressServer = require('./express-server');
const SocketIOServer = require('./socketio-server');
const VideoStream = require('./video-stream');
const KeyboardHID = require('./keyboard-hid');
const MouseHID = require('./mouse-hid');

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

// File to translate JS keycodes to HID keycodes
const KEYBOARD_KEYCODES_FILE = `${__dirname}/keycodes.json`;
// HID files to write to
const KEYBOARD_HID_FILE = '/dev/hidg0';
const MOUSE_HID_FILE = '/dev/hidg1';

// Get ports from env if set, if not use defaults
let httpsPort = process.env.HTTPS_PORT || DEFAULT_HTTPS_PORT;
let streamPort = process.env.STREAM_PORT || DEFAULT_STREAM_PORT;

start().then(() => {
    console.log('Setup complete!');
}).catch(error => {
    console.error('Setup failed!', error);
    process.exit(1);
})

function start(){
    return new Promise((resolve, reject) => {
        // Start express server
        setupHTTPS().then(server => {
            console.log(`HTTPS server running at https://192.168.10.120:${httpsPort}`);
            
            // Start socketio server using express server
            setupSocketIO(server).then(socket => {
                console.log('SocketIO server started');
                
                // Start mjpg-streamer server
                setupStream(socket).then(stream => {
                    console.log('Stream started!');

                    // Start keyboard HID
                    setupKeyboardHID(socket).then(keyboard => {
                        console.log('Keyboard HID started!');
                        
                        // Start mouse HID
                        setupMouseHID(socket).then(mouse => {
                            console.log('Mouse HID started!');

                            // Finish setup
                            resolve();
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        }).catch(reject);
    })
}

function setupHTTPS(){
    return new Promise((resolve, reject) => {
        let server = new ExpressServer(httpsPort, HTTPS_PUBLIC, HTTPS_CERT_PATH, HTTPS_KEY_PATH);
        server.start().then(() => {
            resolve(server);
        }).catch(reject);
    })
}

function setupSocketIO(server){
    return new Promise((resolve, reject) => {
        let socket = new SocketIOServer(server);
        socket.start().then(() => {
            resolve(socket);
        }).catch(reject);
    })
}

function setupStream(socket){
    return new Promise((resolve, reject) => {
        let stream = new VideoStream(streamPort, MJPG_STREAMER_PATH, STREAM_RESOLUTION, STREAM_FRAMERATE);
    
        // Attach stderr, stdout and exit listeners
        stream.onStderr = (stderr) => {
            // console.error('stderr', stderr.toString());
        }

        stream.onStdout = (stdout) => {
            // console.log('stdout', stdout.toString());
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
        stream.start().then(() => {
            resolve(stream);
        }).catch(reject);
    })
}

function setupKeyboardHID(socket){
    return new Promise((resolve, reject) => {
        let keyboard = new KeyboardHID(KEYBOARD_HID_FILE, KEYBOARD_KEYCODES_FILE);

        socket.addListener('keyboard', (keysDown) => {
            keyboard.writeKeys(keysDown).catch(err => {
                console.error('KeyboardHID writeKeys:', err);
            })
        })

        keyboard.start().then(() => {
            resolve(keyboard);
        }).catch(reject);
    })
}

function setupMouseHID(socket){
    return new Promise((resolve, reject) => {
        let mouse = new MouseHID(MOUSE_HID_FILE);

        socket.addListener('mouse', (data) => {
            let buttons = data.buttons;
            let moveX = data.moveX;
            let moveY = data.moveY;

            mouse.write(buttons, moveX, moveY).catch(err => {
                console.error('MouseHID write:', err);
            })
        })

        mouse.start().then(() => {
            resolve(mouse);
        }).catch(reject);
    })
}