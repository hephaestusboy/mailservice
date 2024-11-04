const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve client files from the /public directory

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Relay offer and answer between peers
    socket.on('offer', (data) => {
        socket.broadcast.emit('offer', data); // Send the offer to other peers
    });

    socket.on('answer', (data) => {
        socket.broadcast.emit('answer', data); // Send the answer to other peers
    });

    // Relay ICE candidates between peers
    socket.on('candidate', (data) => {
        socket.broadcast.emit('candidate', data); // Send ICE candidate to other peers
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Signaling server running at http://localhost:${PORT}`);
});
