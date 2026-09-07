require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/db');
const Session = require('../src/models/Session');
const Sequence = require('../src/models/Sequence');
const { nextSessionCode } = require('../src/utils/sessionCode');

async function run() {
  await connectDatabase();
  const sessions = await Session.find({ session_code: { $exists: false } }).sort({ createdAt: 1, _id: 1 });
  const codedSessions = await Session.find({ session_code: /^s\d+$/ }).select('session_code').lean();
  const highestExisting = codedSessions.reduce((highest, session) => Math.max(highest, Number(session.session_code.slice(1))), 0);
  await Sequence.updateOne({ name: 'session_code' }, { $set: { value: highestExisting } }, { upsert: true });
  for (const session of sessions) {
    const sessionCode = await nextSessionCode();
    await Session.collection.updateOne({ _id: session._id }, { $set: { session_code: sessionCode } });
    console.log(`${sessionCode} -> ${session._id}`);
  }
  const latest = await Session.findOne({ session_code: /^s\d+$/ }).sort({ createdAt: -1 }).select('session_code');
  const highest = latest ? Number(latest.session_code.slice(1)) : 0;
  await Sequence.updateOne({ name: 'session_code' }, { $max: { value: highest } }, { upsert: true });
  console.log(`Backfilled ${sessions.length} sessions.`);
}

run()
  .catch((error) => {
    console.error(`Unable to backfill session codes: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
