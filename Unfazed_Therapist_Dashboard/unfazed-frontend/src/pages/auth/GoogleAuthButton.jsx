import { GoogleLogin } from '@react-oauth/google'

export default function GoogleAuthButton({ onSuccess, onError, disabled }) {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-700">Google sign-in is not configured yet.</p>
  }

  return <GoogleLogin onSuccess={onSuccess} onError={onError} useOneTap={false} disabled={disabled} />
}