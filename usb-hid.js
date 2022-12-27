const fs = require('fs');

class USBHID{
    constructor(keycodeFile){
        this.keycodeFile = keycodeFile;
    }

    start(){
        return new Promise((resolve, reject) => {
            this.readKeyCodesFromFile().then(() => {
                resolve()
            }).catch(reject);
        })
    }

    readKeyCodesFromFile(){
        return new Promise((resolve, reject) => {
            fs.readFile(this.keycodeFile, 'utf-8', (err, data) => {
                if (err){
                    reject(err);
                }
                else{
                    this.keyCodes = JSON.parse(data);
                    resolve();
                }
            })
        })
    }

    writeKeys(keysDown){
        return new Promise((resolve, reject) => {
            // Min bytes to write
            const MIN_BYTES = 8;
            // Key codes to write
            let codes = [];
            let nullCode = Number(this.keyCodes.keys.None);

            // Check if modifiers are down, and if so treat them as regular keys
            if (this.checkIfOnlyModifiers(keysDown)){
                // No modifier key
                codes.push(nullCode);
                // Reserved byte
                codes.push(nullCode);

                // Push key codes
                for (let code of this.translateKeysToCodes(keysDown)){
                    codes.push(code);
                }
            }
            else{
                // Split modifier keys from regular keys
                let {modifiers, keys} = this.splitKeys(keysDown);

                // calculate modifier code sum
                let modifierSum = 0;
                for (let code of this.translateModifiersToCodes(modifiers)){
                    modifierSum += code;
                }
                
                // Push modifier sum
                codes.push(modifierSum);
                // Reserved byte
                codes.push(nullCode);

                // Push regular key codes
                for (let code of this.translateKeysToCodes(keys)){
                    codes.push(code);
                }
            }

            // Make sure min codes are pushed
            while (codes.length < MIN_BYTES){
                codes.push(nullCode);
            }

            // Write codes
            this.writeCodes(codes).then(() => {
                resolve();
            }).catch(reject)
        });
    }

    splitKeys(keysDown){
        let modifiers = [];
        let keys = []

        // Loop over the keys and split them
        for (let key of keysDown){
            if (key in this.keyCodes.modifiers){
                modifiers.push(key);
            }
            else{
                keys.push(key)
            }
        }

        return {modifiers, keys};
    }

    translateModifiersToCodes(modifiers){
        let codes = [];

        // Loop over keys and translate them using the modifier table
        for (let key of modifiers){
            if (key in this.keyCodes.modifiers){
                // Convert string hex to int
                codes.push(Number(this.keyCodes.modifiers[key]));
            }
            else{
                console.log('Unknown modifier', key);
            }
        }

        return codes;
    }

    translateKeysToCodes(keys){
        let codes = [];

        // Loop over keys and translate them using the regular key table
        for (let key of keys){
            if (key in this.keyCodes.keys){
                // Convert string hex to int
                codes.push(Number(this.keyCodes.keys[key]));
            }
            else{
                console.log('Unknown key', key);
            }
        }

        return codes;
    }

    checkIfOnlyModifiers(keysDown){
        // Loop over keys and check if only modifier keys are down
        for (let key of keysDown){     
            if (! (key in this.keyCodes.modifiers)){
                return false;
            }
        }

        return true;
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
            fs.writeFile('/dev/hidg0', bytes, 'binary', (err) => {
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

module.exports = USBHID;