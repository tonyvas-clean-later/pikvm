let socket = io();

// Image and div parent elements for video stream
let streamDiv = document.getElementById('stream_div');
let streamImg = document.getElementById('stream_img');

let mouseLockCanvas = document.getElementById('mouse_lock_canvas');

// Timestamps for when frames come in, used for calculating fps
let frameTimes = [];

// Keyboard keys and mouse buttons held down
let keyboardKeysDown = [];
let mouseKeysDown = 0;

// If client mouse is locked and controlling remote mouse
let isMouselocked = false;

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

document.body.onload = () => {
    mouseLockCanvas.requestPointerLock = mouseLockCanvas.requestPointerLock || mouseLockCanvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
}

streamImg.onload = () => {
    resizeStreamImage();
}

document.onkeydown = e => {
    // Check if key is already down
    for (let code of keyboardKeysDown){
        if (e.code == code){
            return
        }
    }
    // Add key to list
    keyboardKeysDown.push(e.code);

    // Check if currently capturing input
    if (isCapturing()){
        // Check if user entered the release keyboard combo
        if (isMouseReleaseCombo()){
            // Unlock mouse
            unlockCapture();
        }
        else{
            // If not, send keys
            sendKeyboard();
            e.preventDefault()
            return false;
        }
    }
}

document.onkeyup = e => {
    // Get index of key in list of keys down
    let i = keyboardKeysDown.indexOf(e.code);
    if (i >= 0){
        // Remove key if found
        keyboardKeysDown.splice(i, 1);
    }

    // Check if capturing user input
    if (isCapturing()){
        sendKeyboard();
        e.preventDefault()
        return false;
    }
}

document.onmousemove = e => {
    if (isCapturing()){
        sendMouse(e.movementX, e.movementY);
    }
}

document.onmousedown = e => {
    if (isCapturing()){
        // If capturing send mouse input
        mouseKeysDown = e.buttons;
        sendMouse();
    
        return false;
    }
    else{
        // Check if clicked over stream after having escaped
        if (isMouseOverStream(e.clientX, e.clientY)){
            // Lock mouse if so
            lockCapture();
        }
    }
}

document.onmouseup = e => {
    if (isCapturing()){
        mouseKeysDown = e.buttons;
        sendMouse();
    
        return false;
    }
}

document.onpointerlockchange = e => {
    if (document.pointerLockElement === mouseLockCanvas || document.mozPointerLockElement === mouseLockCanvas){
        isMouselocked = true;
    }
    else{
        isMouselocked = false;
    }
}

setInterval(() => {
    updateUI();
}, 1000 / 30);

function lockCapture(){
    mouseLockCanvas.requestPointerLock();
}

function unlockCapture(){
    document.exitPointerLock();
}

function isMouseReleaseCombo(){
    const COMBO = ['ControlLeft', 'AltLeft'];

    // Check combo key count
    if (keyboardKeysDown.length != COMBO.length){
        return false;
    }

    // Check if each combo key is one of the keys down
    for (let key of COMBO){
        if (!keyboardKeysDown.includes(key)){
            return false;
        }
    }

    return true;
}

function isMouseOverStream(mouseX, mouseY){
    return (
        // Left side
        mouseX >= streamImg.offsetLeft &&
        // Right side
        mouseX <= streamImg.offsetLeft + streamImg.width &&
        // Top side
        mouseY >= streamImg.offsetTop &&
        // Bottom side
        mouseY <= streamImg.offsetTop + streamImg.height
    )
}

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
    return isMouselocked;
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

function sendMouse(x = 0, y = 0){
    socket.emit('mouse', formatMousePayload(mouseKeysDown, x, y));
}

function clearKeyboard(){
    socket.emit('keyboard', []);
}

function clearMouse(){
    socket.emit('mouse', formatMousePayload(0, 0, 0));
}

function formatMousePayload(buttons, x, y){
    return { buttons: buttons, moveX: x, moveY: y }
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