const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const ChatMessage = require('../models/ChatMessage');

async function getParticipant(sessionId, user) {
  const session = await Session.findById(sessionId).select('therapist_id client_id started_at ends_at status');
  if (!session || !session.started_at) return null;
  const userId = String(user.id);
  const isTherapist = user.role === 'therapist' && String(session.therapist_id) === userId;
  const isClient = user.role === 'client' && String(session.client_id) === userId;
  if (!isTherapist && !isClient) return null;
  const [therapist, client] = await Promise.all([
    Therapist.findById(session.therapist_id).select('name'),
    Client.findById(session.client_id).select('name')
  ]);
  const sender = user.role === 'therapist' ? therapist : client;
  const receiver = user.role === 'therapist' ? client : therapist;
  return { session, sender, receiver };
}

function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('session:wait', async (sessionId) => {
      const session = await Session.findById(sessionId).select('therapist_id client_id started_at ends_at status');
      if (!session) return socket.emit('chat:error', { message: 'Session not found.' });
      const userId = String(socket.user.id);
      const participant = (socket.user.role === 'therapist' && String(session.therapist_id) === userId) || (socket.user.role === 'client' && String(session.client_id) === userId);
      if (!participant) return socket.emit('chat:error', { message: 'You are not a participant in this session.' });
      if (session.status === 'completed') return socket.emit('session:ended', { sessionId: String(session._id) });
      if (session.started_at) return socket.emit('session:started', { sessionId: String(session._id), endsAt: session.ends_at });
      socket.join(`session-wait:${session._id}`);
    });

    socket.on('chat:join', async (sessionId) => {
      const participant = await getParticipant(sessionId, socket.user);
      if (!participant) return socket.emit('chat:error', { message: 'The therapist has not started this session or you are not a participant.' });
      socket.sessionId = String(participant.session._id);
      socket.senderName = participant.sender.name;
      socket.join(`conversation:${participant.session._id}`);
      const messages = await ChatMessage.find({ session_id: participant.session._id }).sort({ sent_at: 1 }).lean();
      socket.emit('chat:history', messages);
      socket.emit('session:details', { startedAt: participant.session.started_at, endsAt: participant.session.ends_at });
      socket.emit('chat:ready', { conversationId: String(participant.session._id) });
    });

    socket.on('chat:message', async ({ conversationId, message }) => {
      if (!conversationId || !message?.trim() || socket.sessionId !== String(conversationId)) return;
      const participant = await getParticipant(conversationId, socket.user);
      if (!participant || participant.session.status === 'completed') return;
      const saved = await ChatMessage.create({
        session_id: conversationId,
        sender_id: socket.user.id,
        sender_role: socket.user.role,
        sender_name: participant.sender.name,
        receiver_id: socket.user.role === 'therapist' ? participant.session.client_id : participant.session.therapist_id,
        receiver_name: participant.receiver.name,
        content: message.trim()
      });
      io.to(`conversation:${conversationId}`).emit('chat:message', saved.toObject());
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      if (socket.sessionId !== String(conversationId)) return;
      socket.to(`conversation:${conversationId}`).emit('chat:typing', { userId: String(socket.user.id), name: socket.senderName, isTyping: Boolean(isTyping) });
    });

    socket.on('chat:read', async ({ conversationId, messageId }) => {
      if (socket.sessionId !== String(conversationId) || !messageId) return;
      const message = await ChatMessage.findOneAndUpdate({ _id: messageId, session_id: conversationId, receiver_id: socket.user.id, read_at: null }, { read_at: new Date() }, { new: true }).lean();
      if (message) io.to(`conversation:${conversationId}`).emit('chat:read', { messageId, readAt: message.read_at });
    });
  });
}

module.exports = registerChatSocket;
