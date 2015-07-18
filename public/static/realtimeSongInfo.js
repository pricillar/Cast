/* global io */

var socket = io();
socket.on('metadata', function onMetadataUpdate (msg) {
    if (document.getElementById('meta-' + msg.stream) !== null) {
        document.getElementById('meta-' + msg.stream).textContent = msg.song;
    }
});

socket.on('listenerCountChange', function onListenerCountChange (msg) {
    if (document.getElementById('listencount-' + msg.stream) !== null) {
        if (msg.count === 1) {
            document.getElementById('listencount-'+msg.stream).textContent = '1 person is listening right now.';
        } else {
            document.getElementById('listencount-'+msg.stream).textContent = msg.count + ' people are listening right now.';
        }
    }
});
