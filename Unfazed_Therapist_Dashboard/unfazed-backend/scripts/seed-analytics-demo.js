require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDatabase = require('../src/config/db');
const Therapist = require('../src/models/Therapist');
const Client = require('../src/models/Client');
const Session = require('../src/models/Session');
const Payment = require('../src/models/Payment');
const Availability = require('../src/models/Availability');
const { nextSessionCode } = require('../src/utils/sessionCode');

const therapistId = process.env.DEMO_THERAPIST_ID || '6a9d499b4d860b562bd7f6f7';
const primaryClientId = process.env.DEMO_CLIENT_ID || '6a9ebff66b740fa56823e61a';
const seedMarker = 'demo://analytics-seed';
const seedEmailPrefix = 'analytics-demo-';

function dateDaysFromNow(days, hour = 10) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value;
}

async function getOrCreateClients(therapist) {
  const primary = await Client.findOne({ _id: primaryClientId, therapist_id: therapist._id });
  if (!primary) throw new Error(`Client ${primaryClientId} was not found for therapist ${therapist._id}`);

  const passwordHash = await bcrypt.hash('DemoPass123!', 10);
  const clients = [primary];
  for (const [index, name] of ['Asha Demo', 'Vikram Demo', 'Meera Demo', 'Arjun Demo', 'Nisha Demo', 'Kabir Demo'].entries()) {
    const email = `${seedEmailPrefix}${index + 1}@example.com`;
    const client = await Client.findOneAndUpdate(
      { email, therapist_id: therapist._id },
      { $setOnInsert: { therapist_id: therapist._id, name, email, password_hash: passwordHash, phone: `900000000${index + 1}`, status: 'active' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    clients.push(client);
  }
  return clients;
}

async function run() {
  await connectDatabase();
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) throw new Error(`Therapist ${therapistId} was not found`);

  if (process.argv.includes('--reset')) {
    await Session.deleteMany({ meeting_url: seedMarker });
    await Payment.deleteMany({ gateway_transaction_id: /^demo_analytics_/ });
    await Client.deleteMany({ therapist_id: therapist._id, email: new RegExp(`^${seedEmailPrefix}`) });
    console.log('Removed previous analytics demo data.');
  }

  const clients = await getOrCreateClients(therapist);
  const sessionSpecs = [
    { days: -2, hour: 10, status: 'completed', client: clients[0], amount: 1500 },
    { days: -5, hour: 12, status: 'completed', client: clients[1], amount: 1800 },
    { days: -9, hour: 15, status: 'completed', client: clients[2], amount: 2200 },
    { days: -14, hour: 11, status: 'no_show', client: clients[0], amount: 1500 },
    { days: -28, hour: 10, status: 'completed', client: clients[1], amount: 1800 },
    { days: -45, hour: 14, status: 'cancelled', client: clients[2], amount: 2200 },
    { days: -75, hour: 16, status: 'completed', client: clients[0], amount: 1500 },
    { days: 0, hour: new Date().getHours() + 2, status: 'scheduled', client: clients[1], amount: 1800 },
    { days: 1, hour: 11, status: 'confirmed', client: clients[2], amount: 2200 },
  ];

  const demoStatuses = ['completed', 'completed', 'completed', 'no_show', 'cancelled', 'completed'];
  for (let index = 0; index < 48; index += 1) {
    const status = index < 2 ? 'completed' : demoStatuses[index % demoStatuses.length];
    sessionSpecs.push({
      days: -(index * 28 + 3),
      hour: 9 + (index % 8),
      status,
      client: clients[index % clients.length],
      amount: 1200 + (index % 5) * 300,
    });
  }

  let createdSessions = 0;
  let createdPayments = 0;
  for (const spec of sessionSpecs) {
    const startsAt = dateDaysFromNow(spec.days, spec.hour);
    const endsAt = new Date(startsAt.getTime() + 60 * 60000);
    const session = await Session.create({
      session_code: await nextSessionCode(),
      therapist_id: therapist._id,
      client_id: spec.client._id,
      starts_at: startsAt,
      ends_at: endsAt,
      status: spec.status,
      meeting_url: seedMarker,
      cancellation_reason: spec.status === 'cancelled' ? 'Demo seed cancellation' : undefined,
    });
    createdSessions += 1;

    if (['completed', 'confirmed'].includes(spec.status)) {
      await Payment.create({
        therapist_id: therapist._id,
        client_id: spec.client._id,
        session_id: session._id,
        gateway_transaction_id: `demo_analytics_${session._id}`,
        amount: spec.amount,
        net_amount: spec.amount,
        status: 'paid',
        payment_method: 'demo',
        starts_at: startsAt,
        ends_at: endsAt,
        duration: 60,
        paid_at: spec.status === 'completed' ? startsAt : new Date(),
      });
      createdPayments += 1;
    }
  }

  const availability = await Availability.findOne({ therapist_id: therapist._id }) || new Availability({ therapist_id: therapist._id });
  const waitlistDate = new Date();
  waitlistDate.setDate(waitlistDate.getDate() + 3);
  const waitlistDateKey = waitlistDate.toISOString().slice(0, 10);
  const hasWaitlistEntry = availability.waitlist.some((entry) => String(entry.client_id) === String(clients[0]._id) && entry.date === waitlistDateKey && entry.duration === 60 && entry.status === 'waiting');
  if (!hasWaitlistEntry) {
    availability.waitlist.push({ client_id: clients[0]._id, date: waitlistDateKey, duration: 60, status: 'waiting' });
    await availability.save();
  }

  console.log(`Created ${createdSessions} demo sessions and ${createdPayments} demo payments.`);
  console.log(`Demo clients: ${clients.map((client) => `${client.name} <${client.email}>`).join(', ')}`);
  console.log(`Waitlist test date: ${waitlistDateKey}`);
}

run()
  .catch((error) => {
    console.error(`Unable to seed analytics demo data: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
