let socket = io();
let img = document.getElementById('img');

socket.on('stream', frame => {
    let buffer = new Uint8Array(frame);
    let blob = new Blob([buffer.buffer], {type: 'image/jpg'});
    let src = URL.createObjectURL(blob);

    img.src = src;
})