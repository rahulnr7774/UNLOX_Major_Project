export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phonePattern = /^\d{10}$/
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

export function isValidEmail(value) {
	return emailPattern.test(value.trim())
}

export function isValidPhone(value) {
	return phonePattern.test(value.trim())
}

export function isValidPassword(value) {
	return passwordPattern.test(value)
}