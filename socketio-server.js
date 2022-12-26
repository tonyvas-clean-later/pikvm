const socketio = require('socket.io');

class SocketIOServer{
    constructor(server){
        this.server = server;
    }

    start(){
        return new Promise((resolve, reject) => {
            // Create basic socket io server
            this.io = socketio(this.server.server);
            resolve();
        })
    }
}

module.exports = SocketIOServer;