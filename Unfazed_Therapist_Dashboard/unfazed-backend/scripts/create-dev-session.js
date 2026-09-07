require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/db');
const Therapist = require('../src/models/Therapist');
const Client = require('../src/models/Client');
const Session = require('../src/models/Session');
const Payment = require('../src/models/Payment');
const { nextSessionCode } = require('../src/utils/sessionCode');

function getOption(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function run() {
  if (process.env.NODE_ENV === 'production') throw new Error('This development script cannot run in production.');

  const therapistId = getOption('therapist', '6a9d499b4d860b562bd7f6f7');
  const clientId = getOption('client', '6a9ebff66b740fa56823e61a');
  const duration = Number(getOption('duration', 60));
  const amount = Number(getOption('amount', 1500));
  const startsAt = new Date(getOption('start', Date.now() + 24 * 60 * 60 * 1000));
  const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

  if (!mongoose.isValidObjectId(therapistId) || !mongoose.isValidObjectId(clientId)) throw new Error('Invalid therapist or client ObjectId.');
  if (![30, 45, 60, 90].includes(duration)) throw new Error('Duration must be 30, 45, 60, or 90 minutes.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than zero.');
  if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) throw new Error('Start time must be a valid future date.');

  await connectDatabase();
  const [therapist, client] = await Promise.all([
    Therapist.findById(therapistId).select('_id name'),
    Client.findOne({ _id: clientId, therapist_id: therapistId }).select('_id name email')
  ]);
  if (!therapist) throw new Error('Therapist not found.');
  if (!client) throw new Error('Client not found or does not belong to this therapist.');

  const conflict = await Session.exists({
    therapist_id: therapistId,
    status: { $in: ['scheduled', 'confirmed'] },
    starts_at: { $lt: endsAt },
    ends_at: { $gt: startsAt }
  });
  if (conflict) throw new Error('The selected time overlaps an existing session.');

  const session = await mongoose.connection.transaction(async (dbSession) => {
    const [createdSession] = await Session.create([{
      therapist_id: therapistId,
      session_code: await nextSessionCode(),
      client_id: clientId,
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'confirmed',
      mode: 'online'
    }], { session: dbSession });

    await Payment.create([{
      therapist_id: therapistId,
      client_id: clientId,
      session_id: createdSession._id,
      gateway_transaction_id: `dev_${createdSession._id}`,
      amount,
      net_amount: amount,
      starts_at: startsAt,
      ends_at: endsAt,
      duration,
      status: 'paid',
      payment_method: 'development',
      paid_at: new Date()
    }], { session: dbSession });

    return createdSession;
  });

  console.log(JSON.stringify({
    message: 'Development session and paid payment created.',
    sessionId: session._id.toString(),
    therapist: therapist.name,
    client: client.name,
    startsAt: session.starts_at.toISOString(),
    endsAt: session.ends_at.toISOString(),
    status: session.status,
    paymentStatus: 'paid'
  }, null, 2));
}

run()
  .catch((error) => {
    console.error(`Unable to create development session: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
