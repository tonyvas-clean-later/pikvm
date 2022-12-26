let socket = io();
let img = document.getElementById('img');

// Listen for stream data
socket.on('stream', frame => {
    // Encode frame data into a url src for image
    let buffer = new Uint8Array(frame);
    let blob = new Blob([buffer.buffer], {type: 'image/jpg'});
    let src = URL.createObjectURL(blob);

    // Set image src to encoded url
    img.src = src;
})