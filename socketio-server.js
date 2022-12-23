const socketio = require('socket.io');

class SocketIOServer{
    constructor(server){
        this.server = server;
    }

    start(){
        return new Promise((resolve, reject) => {
            this.io = socketio(this.server.server);
            resolve();
        })
    }
}

module.exports = SocketIOServer;