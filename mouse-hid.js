const fs = require('fs');

class MouseHID{
    constructor(hidfile){
        this.hidfile = hidfile;
    }

    start(){
        return new Promise((resolve, reject) => {
            resolve()
        })
    }

    write(buttonCode, moveX, moveY){
        return new Promise((resolve, reject) => {
            let codes = [buttonCode, moveX, moveY];

            // Write codes
            this.writeCodes(codes).then(() => {
                resolve();
            }).catch(reject)
        });
    }

    writeCodes(codes){
        return new Promise((resolve, reject) => {
            // Convert the code values into byte values
            let bytes = '';
            for (let code of codes){
                bytes += String.fromCharCode(code);
            }

            // Write bytes
            // console.log(codes, bytes.length);
            fs.writeFile(this.hidfile, bytes, 'binary', (err) => {
                if (err){
                    reject(err)
                }
                else{
                    resolve();
                }
            })
        })
    }
}

module.exports = MouseHID;