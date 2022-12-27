const socketio = require('socket.io');

class SocketIOServer{
    constructor(server){
        this.server = server;
        this.listeners = {};
    }

    start(){
        return new Promise((resolve, reject) => {
            // Create basic socket io server
            this.io = socketio(this.server.server);

            this.io.on('connect', socket => {
                for (let key in this.listeners){
                    socket.on(key, (data) => {
                        this.listeners[key](data);
                    })
                }
            })

            resolve();
        })
    }

    addListener(key, callback){
        this.listeners[key] = callback;
    }
}

module.exports = SocketIOServer;