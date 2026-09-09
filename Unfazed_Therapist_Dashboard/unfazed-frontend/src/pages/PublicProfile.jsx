import { CalendarDays, Globe2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import About from '../components/profile/About'
import Hero from '../components/profile/Hero'
import ServiceCard from '../components/profile/ServiceCard'

function setMeta(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setDescription(content) {
  let element = document.head.querySelector('meta[name="description"]')
  if (!element) {
    element = document.createElement('meta')
    element.name = 'description'
    document.head.appendChild(element)
  }
  element.content = content
}

export default function PublicProfile() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [packages, setPackages] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    axiosInstance.get(`/therapists/public/${slug}`)
      .then(({ data }) => {
        if (cancelled) return
        const therapist = data.therapist
        const title = `${therapist.name} | Unfazed`
        const description = (therapist.bio || `Connect with ${therapist.name} on Unfazed.`).slice(0, 160)
        setProfile(therapist)
        setPackages(data.packages || [])
        document.title = title
        setDescription(description)
        setMeta('og:title', title)
        setMeta('og:description', description)
        setMeta('og:type', 'profile')
        setMeta('og:url', window.location.href)
        setMeta('og:site_name', 'Unfazed')
      })
      .catch((requestError) => { if (!cancelled) setError(requestError.response?.data?.message || 'Profile not found.') })
    return () => { cancelled = true }
  }, [slug])

  if (error) return <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center"><div><h1 className="font-display text-3xl font-semibold">Profile unavailable</h1><p className="mt-3 text-ink/60">{error}</p><button onClick={() => navigate('/')} className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">Back home</button></div></main>
  if (!profile) return <main className="flex min-h-screen items-center justify-center bg-cream text-sm text-ink/60">Loading profile...</main>

  const book = () => navigate('/client/book')
    return <main className="min-h-screen bg-cream text-ink"><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-14"><Hero title={profile.name} profileImage={profile.profile_image} specializations={profile.specializations || []} languages={profile.languages || []} /><div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_.7fr]"><div className="space-y-10"><About><p className="text-sm font-bold uppercase tracking-[.16em] text-moss">About the practice</p><h2 className="mt-2 font-display text-3xl font-semibold">A thoughtful space for your next step.</h2><p className="mt-4 whitespace-pre-line text-base leading-8">{profile.bio || 'This therapist has not added a biography yet.'}</p></About><section><div className="flex items-center gap-2 text-moss"><Sparkles size={18} /><p className="text-sm font-bold uppercase tracking-[.16em]">Specializations</p></div><div className="mt-4 flex flex-wrap gap-3">{(profile.specializations?.length ? profile.specializations : ['Individual therapy']).map((item) => <span key={item} className="rounded-full border border-moss/20 bg-white px-4 py-2 text-sm font-semibold">{item}</span>)}</div></section></div><aside className="h-fit rounded-[28px] bg-ink p-6 text-white sm:p-8"><p className="text-sm font-bold uppercase tracking-[.16em] text-sage">Work together</p><h2 className="mt-3 font-display text-3xl font-semibold">Find a rhythm that fits.</h2><p className="mt-6 flex items-center gap-3 text-sm text-white/70"><Globe2 size={17} />Online sessions available</p><button onClick={book} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-bold text-ink hover:bg-white"><CalendarDays size={17} />Book a session</button></aside></div><section className="mt-14"><p className="text-sm font-bold uppercase tracking-[.16em] text-moss">Services</p><h2 className="mt-2 font-display text-3xl font-semibold">Ways to work together</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{packages.map((item) => <ServiceCard key={item._id} title={item.name} description={item.description} sessionCount={item.session_count} price={item.total_price} onBook={book} />)}</div>{!packages.length && <p className="mt-6 rounded-2xl border border-dashed border-ink/15 px-5 py-8 text-sm text-ink/55">Services will appear here when this therapist publishes them.</p>}</section></div></main>
}
