require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDatabase = require('./src/config/db');
const registerChatSocket = require('./src/sockets/chatSocket');
const { startChatCleanupJob } = require('./src/services/chatCleanupService');

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
});
app.set('io', io);
registerChatSocket(io);

async function start() {
  await connectDatabase();
  startChatCleanupJob();
  server.listen(port, '0.0.0.0', () => console.log(`Unfazed API listening on port ${port}`));
}

function shutdown(signal) {
  console.log(`${signal} received; shutting down server`);
  io.close();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exit(1);
});
