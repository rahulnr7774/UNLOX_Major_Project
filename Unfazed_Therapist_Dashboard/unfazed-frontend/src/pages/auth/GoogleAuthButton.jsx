import { GoogleLogin } from '@react-oauth/google'

export default function GoogleAuthButton({ onSuccess, onError, disabled }) {
  return <GoogleLogin onSuccess={onSuccess} onError={onError} useOneTap={false} disabled={disabled} />
}