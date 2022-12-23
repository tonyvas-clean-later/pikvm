const express = require("express");
const https = require('https');
const fs = require('fs');

class ExpressServer{
    constructor(port, certPath, keyPath, publicPath){
        this.port = port;
        this.certPath = certPath;
        this.keyPath = keyPath;
        this.publicPath = publicPath;
    }

    start(){
        return new Promise((resolve, reject) => {
            this.getHttpsCreds().then(creds => {
                this.app = express();
                this.server = https.createServer(creds, this.app);
    
                this.app.use(express.static(this.publicPath));

                this.app.all("*", (req, res, next) => {
                    console.log(`${new Date().toLocaleString()} | ${req.method} | ${req.socket.remoteAddress} | ${req.url}`);
                    next();
                });

                this.server.listen(this.port, () => {
                    resolve();
                });
            }).catch(reject);
        })
    }

    getHttpsCreds(){
        return new Promise((resolve, reject) => {
            let creds = {};
            let promises = [
                this.getCert().then(data => {creds['cert'] = data}),
                this.getKey().then(data => {creds['key'] = data}),
            ];

            Promise.all(promises).then(() => {
                resolve(creds)
            }).catch(reject);
        })
    }

    getCert(){
        return this.readFile(this.certPath);
    }

    getKey(){
        return this.readFile(this.keyPath);
    }

    readFile(file){
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf-8', (err, data) => {
                if (err){
                    reject(err)
                }
                else{
                    resolve(data);
                }
            })
        })
    }
}

module.exports = ExpressServer;