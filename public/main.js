let socket = io();

let streamDiv = document.getElementById('stream_div');
let streamImg = document.getElementById('stream_img');

let frameTimes = [];
let keyboardKeysDown = [];
let mouseKeysDown = 0;
let mousePosition = { x: null, y: null }

// Listen for stream data
socket.on('stream', frame => {
    // Log framerate
    // console.log('fps', measureFPS());

    // Encode frame data into a url src for image
    let buffer = new Uint8Array(frame);
    let blob = new Blob([buffer.buffer], {type: 'image/jpg'});
    let src = URL.createObjectURL(blob);

    // Set image src to encoded url
    streamImg.src = src;
})

streamImg.onload = () => {
    resizeStreamImage();
}

document.onkeydown = e => {
    if (isCapturing()){
        for (let code of keyboardKeysDown){
            if (e.code == code){
                return
            }
        }
    
        keyboardKeysDown.push(e.code);
        sendKeyboard();
    
        return false;
    }
}

document.onkeyup = e => {
    if (isCapturing()){
        let i = keyboardKeysDown.indexOf(e.code);
        if (i >= 0){
            keyboardKeysDown.splice(i, 1);
        }

        sendKeyboard();

        return false;
    }
}

document.onmousemove = e => {
    let x = e.clientX;
    let y = e.clientY;

    mousePosition = {x, y};

    if (isCapturing()){
        sendMouse();
    }
}

document.onmousedown = e => {
    if (isCapturing()){
        mouseKeysDown = e.buttons;
        sendMouse();
    
        return false;
    }
}

document.onmouseup = e => {
    if (isCapturing()){
        mouseKeysDown = e.buttons;
        sendMouse();
    
        return false;
    }
}

setInterval(() => {
    updateUI();
}, 1000 / 30);

function updateUI(){
    let span = document.getElementById('capturing_span');

    if (isCapturing()){
        span.innerHTML = 'Capturing keypresses!'
        span.style.color = 'lime'
    }
    else{
        span.innerHTML = 'Not capturing keypresses!'
        span.style.color = 'red'
    }
}

function isCapturing(){
    let imgX = streamImg.offsetLeft;
    let imgY = streamImg.offsetTop;
    let imgW = streamImg.width;
    let imgH = streamImg.height;

    return mousePosition.x >= imgX && mousePosition.x <= imgX + imgW && mousePosition.y >= imgY && mousePosition.y <= imgY + imgH;
}

function resizeStreamImage(){
    const IMG_ASPECT_RATIO = 1920 / 1080;

    // Image sizes
    let imgWidth = streamImg.width;
    let imgHeight = streamImg.height;

    // Image container sizes
    let divWidth = streamDiv.clientWidth;
    let divHeight = streamDiv.clientHeight;

    // Sizes the image should have
    let targetWidth = imgWidth;
    let targetHeight = imgHeight;

    // Check if image will be too tall if maximizing width
    if (divWidth / IMG_ASPECT_RATIO > divHeight){
        // Limit is the height of div
        targetHeight = divHeight;
        targetWidth = divHeight * IMG_ASPECT_RATIO;
    }
    else{
        // Limit is the width of div
        targetWidth = divWidth;
        targetHeight = divWidth / IMG_ASPECT_RATIO;
    }

    // If target sizes are different from current sizes
    if (targetWidth != imgWidth || targetHeight != imgHeight){
        streamImg.width = targetWidth;
        streamImg.height = targetHeight;
    }
}

function sendKeyboard(){
    socket.emit('keyboard', keyboardKeysDown);
}

function sendMouse(){
    socket.emit('mouse', {buttons: mouseKeysDown, position: mousePosition});
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