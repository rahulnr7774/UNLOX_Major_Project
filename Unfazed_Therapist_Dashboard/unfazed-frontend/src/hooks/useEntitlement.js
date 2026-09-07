import { useAuth } from '../context/AuthContext'

export default function useEntitlement(requiredTier = 'free') {
  const { user } = useAuth() || {}
  const tiers = { free: 0, starter: 1, professional: 2, enterprise: 3 }
  return (tiers[user?.subscriptionTier || 'free'] || 0) >= (tiers[requiredTier] || 0)
}