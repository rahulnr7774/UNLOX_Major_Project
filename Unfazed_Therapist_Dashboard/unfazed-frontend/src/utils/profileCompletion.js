export function isTherapistProfileComplete(user) {
  return Boolean(
    user?.name?.trim() &&
    user?.bio?.trim() &&
    Array.isArray(user?.specializations) && user.specializations.length > 0 &&
    Array.isArray(user?.languages) && user.languages.length > 0
  )
}

export function isClientProfileComplete(user) {
  return Boolean(
    user?.name?.trim() &&
    user?.email?.trim() &&
    user?.phone?.trim() &&
    user?.date_of_birth &&
    user?.gender?.trim() &&
    user?.presenting_concern?.trim() &&
    user?.history?.trim() &&
    !user?.must_change_password
  )
}

export function getPostLoginPath(user) {
  if (user?.role === 'client' && user?.approval_status === 'pending') return '/client/pending'
  if (user?.role === 'client') return isClientProfileComplete(user) ? '/client-portal' : '/client/profile'
  return isTherapistProfileComplete(user) ? '/dashboard' : '/profile'
}
