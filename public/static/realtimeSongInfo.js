var socket = io();
socket.on('metadata', function(msg) {
    if (document.getElementById("meta-" + msg.stream) !== null) {
        document.getElementById("meta-"+msg.stream).innerHTML = msg.song
    }
});

socket.on('listenerCountChange',function(msg) {
    if (document.getElementById("listencount-" + msg.stream) !== null) {
        if (msg.count === 1){
            document.getElementById("listencount-"+msg.stream).innerHTML = "1 person is listening right now."
        }else{
            document.getElementById("listencount-"+msg.stream).innerHTML = msg.count + " people are listening right now."
        }
    }
})