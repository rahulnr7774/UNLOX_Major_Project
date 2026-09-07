require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDatabase = require('./src/config/db');
const registerChatSocket = require('./src/sockets/chatSocket');
const { startChatCleanupJob } = require('./src/services/chatCleanupService');

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });
app.set('io', io);
registerChatSocket(io);

async function start() {
  await connectDatabase();
  startChatCleanupJob();
  server.listen(port, () => console.log(`Unfazed API listening on port ${port}`));
}

start().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exit(1);
});
