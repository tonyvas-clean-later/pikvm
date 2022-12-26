const express = require("express");
const https = require('https');
const fs = require('fs');

class ExpressServer{
    constructor(port, publicPath, certPath, keyPath){
        this.port = port;
        this.publicPath = publicPath;
        this.certPath = certPath;
        this.keyPath = keyPath;
    }

    start(){
        return new Promise((resolve, reject) => {
            // Get certificates and start https express server
            this.getHttpsCreds().then(creds => {
                this.app = express();
                this.server = https.createServer(creds, this.app);
    
                // Server static files from public dir
                this.app.use(express.static(this.publicPath));

                // Log all requests
                this.app.all("*", (req, res, next) => {
                    console.log(`${new Date().toLocaleString()} | ${req.method} | ${req.socket.remoteAddress} | ${req.url}`);
                    next();
                });

                // Start listener
                this.server.listen(this.port, () => {
                    resolve();
                });
            }).catch(reject);
        })
    }

    getHttpsCreds(){
        return new Promise((resolve, reject) => {
            let creds = {};

            // Start reading cert files
            let promises = [
                this.getCert().then(data => {creds['cert'] = data}),
                this.getKey().then(data => {creds['key'] = data}),
            ];

            // Wait for promises to complete and resolve certificates
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
            // Promise wrapper for readFile
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