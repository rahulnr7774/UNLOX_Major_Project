const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

function isValidPhone(value) {
  return typeof value === 'string' && PHONE_PATTERN.test(value.trim());
}

function isValidPassword(value) {
  return typeof value === 'string' && PASSWORD_PATTERN.test(value);
}

module.exports = { isValidEmail, isValidPhone, isValidPassword };