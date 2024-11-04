const socket = io();
let localConnection;
let dataChannel;
let remoteConnection;

// Set up the signaling handlers
socket.on('offer', async (offer) => {
    if (!localConnection) startPeerConnection();

    await localConnection.setRemoteDescription(offer);
    const answer = await localConnection.createAnswer();
    await localConnection.setLocalDescription(answer);

    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await localConnection.setRemoteDescription(answer);
});

socket.on('candidate', (candidate) => {
    const rtcCandidate = new RTCIceCandidate(candidate);
    localConnection.addIceCandidate(rtcCandidate);
});

function startPeerConnection() {
    // Create the RTCPeerConnection
    localConnection = new RTCPeerConnection();

    // Set up data channel for messaging
    dataChannel = localConnection.createDataChannel("chat");
    dataChannel.onopen = () => console.log("Data channel opened");
    dataChannel.onmessage = (event) => displayMessage(event.data);

    // ICE candidate handling
    localConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    // Handle receiving data channel from the remote peer
    localConnection.ondatachannel = (event) => {
        remoteConnection = event.channel;
        remoteConnection.onmessage = (event) => displayMessage(event.data);
    };
}

// Send message through data channel
function sendMessage(message) {
    if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(message);
    }
}

// Display message in the UI
function displayMessage(message) {
    const messages = document.getElementById('messages');
    const messageItem = document.createElement('li');
    messageItem.textContent = message;
    messages.appendChild(messageItem);
}

// UI Event Handlers
document.getElementById('sendBtn').addEventListener('click', () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    sendMessage(message);
    displayMessage(`You: ${message}`);
    messageInput.value = '';
});

// Initiate offer for connection setup
async function initiateConnection() {
    if (!localConnection) startPeerConnection();

    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);

    socket.emit('offer', offer);
}

// Auto-initiate the connection when loaded
window.onload = initiateConnection;
