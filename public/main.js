let socket = io();
let img = document.getElementById('img');

let frameTimes = [];
let keysDown = [];

// Listen for stream data
socket.on('stream', frame => {
    // // Log framerate
    console.log('fps', measureFPS());

    // Encode frame data into a url src for image
    let buffer = new Uint8Array(frame);
    let blob = new Blob([buffer.buffer], {type: 'image/jpg'});
    let src = URL.createObjectURL(blob);

    // Set image src to encoded url
    img.src = src;
})

document.body.onkeydown = e => {
    for (let code of keysDown){
        if (e.code == code){
            return
        }
    }

    keysDown.push(e.code);
    sendKeysDown();
}

document.body.onkeyup = e => {
    let i = keysDown.indexOf(e.code);
    if (i >= 0){
        keysDown.splice(i, 1);
    }

    sendKeysDown();
}

function sendKeysDown(){
    console.log(keysDown);
    socket.emit('keys', keysDown);
}

function measureFPS(){
    // Max frame times to remember
    const MAX_FRAMETIME_HIST = 30;

    // Append time of current frame
    frameTimes.push(new Date().getTime());
    
    // Remove oldes frames if above limit
    while (frameTimes.length > MAX_FRAMETIME_HIST){
        frameTimes.splice(0, 1);
    }

    // Calculate fps
    let ms = frameTimes[frameTimes.length - 1] - frameTimes[0];
    return frameTimes.length / ms * 1000;
}