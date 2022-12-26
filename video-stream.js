const {spawn} = require('child_process');
const fetch = require('node-fetch');

class VideoStream{
    constructor(port, modulePath, resolution, framerate){
        this.port = port;
        this.modulePath = modulePath;
        this.resolution = resolution;
        this.framerate = framerate;

        // Bool to prevent trying to get a frame while already getting one
        this.gettingFrame = false;
    }

    start(){
        return new Promise((resolve, reject) => {
            // Start mjpg_streamer process
            this.process = spawn(`${this.modulePath}/mjpg_streamer`, [
                '-i', `${this.modulePath}/input_uvc.so -f ${this.framerate} -r ${this.resolution}`,
                '-o', `${this.modulePath}/output_http.so -w ${this.modulePath}/www -p ${this.port}`
            ]);

            // Attach listeners
            this.process.stdout.on('data', (data) => {
                this.onStdout(data);
            })

            this.process.stderr.on('data', data => {
                this.onStderr(data)
            })

            this.process.on('exit', (code, signal) => {
                this.onExit(code, signal);
            })

            // Start interval to get a frame from the streamer
            this.handle = setInterval(() => {
                // Make sure not already getting a frame
                if (!this.gettingFrame){
                    this.gettingFrame = true;

                    // Get a frame and send event
                    this.getFrame().then((frame) => {
                        this.onFrame(frame);
                    }).catch((err) => {
                        // Print error for now
                        console.error(err);
                    }).finally(() => {
                        // Release bool lock after finishing
                        this.gettingFrame = false;
                    })
                }
            }, 1000 / this.framerate);

            resolve();
        })
    }

    getFrame(){
        return new Promise((resolve, reject) => {
            // Fetch a frame from mjpg-streamer and resolve buffer data
            fetch(`http://localhost:${this.port}?action=snapshot`).then(res => res.arrayBuffer()).then(arrayBuffer => {
                resolve(arrayBuffer)
            }).catch(reject)
        })
    }

    onFrame(frame){}

    onStdout(stdout){}

    onStderr(stderr){}

    onExit(code, signal){}
}

module.exports = VideoStream;