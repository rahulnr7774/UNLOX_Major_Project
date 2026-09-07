const { sendEmail } = require('./emailServices');

async function sendNotification({ channel, recipient, subject, message }) {
  if (channel !== 'email') {
    console.log(`[notification:${channel}] ${recipient} - ${subject}: ${message}`);
    return { delivered: false, channel, recipient };
  }

  const result = await sendEmail({ to: recipient, subject, text: message, html: `<p>${message}</p>` });
  return { delivered: true, channel, recipient, messageId: result.messageId };
}

module.exports = { sendNotification };
