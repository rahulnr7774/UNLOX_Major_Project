const Sequence = require('../models/Sequence');

async function nextSessionCode() {
  const sequence = await Sequence.findOneAndUpdate(
    { name: 'session_code' },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `s${sequence.value}`;
}

module.exports = { nextSessionCode };
