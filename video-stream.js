const {spawn} = require('child_process');
const fetch = require('node-fetch');

class VideoStream{
    constructor(port, modulePath, resolution, framerate){
        this.port = port;
        this.modulePath = modulePath;
        this.resolution = resolution;
        this.framerate = framerate;

        this.gettingFrame = false;
    }

    start(){
        return new Promise((resolve, reject) => {
            this.process = spawn(`${this.modulePath}/mjpg_streamer`, [
                '-i', `${this.modulePath}/input_uvc.so -f ${this.framerate} -r ${this.resolution}`,
                '-o', `${this.modulePath}/output_http.so -w ${this.modulePath}/www -p ${this.port}`
            ]);

            this.process.stdout.on('data', (data) => {
                this.onStdout(data);
            })

            this.process.stderr.on('data', data => {
                this.onStderr(data)
            })

            this.process.on('exit', (code, signal) => {
                this.onExit(code, signal);
            })

            this.handle = setInterval(() => {
                if (!this.gettingFrame){
                    this.gettingFrame = true;

                    this.getFrame().then((frame) => {
                        this.onFrame(frame);
                    }).catch((err) => {
                        console.error(err);
                    }).finally(() => {
                        this.gettingFrame = false;
                    })
                }
            }, 1000 / this.framerate);

            resolve();
        })
    }

    getFrame(){
        return new Promise((resolve, reject) => {
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