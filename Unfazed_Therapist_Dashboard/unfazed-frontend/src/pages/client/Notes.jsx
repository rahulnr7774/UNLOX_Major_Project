import { FileText, LockKeyhole, Calendar } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import axiosInstance from '../../api/axiosInstance'
import PageBackButton from '../../components/common/PageBackButton'

function plainText(content) {
  return String(content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function sanitizeNoteHtml(content) {
  const documentNode = new DOMParser().parseFromString(String(content || ''), 'text/html')
  const allowedTags = new Set(['P', 'H3', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'BR'])
  documentNode.body.querySelectorAll('*').forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(documentNode.createTextNode(element.textContent || ''))
      return
    }
    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name))
  })
  return documentNode.body.innerHTML
}

function isMeaningfulNote(note) {
  return !['Subjective Objective Assessment Plan', 'Data Assessment Plan'].includes(plainText(note.content))
}

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance.get('/clients/portal')
      .then(({ data }) => setNotes(data.sharedNotes || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your notes.'))
      .finally(() => setLoading(false))
  }, [])

  const visibleNotes = useMemo(() => notes.filter(isMeaningfulNote), [notes])

  if (loading) return <section className="py-12 text-sm text-[#64748B]">Loading your notes...</section>

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <PageBackButton to="/client-portal" label="Back to portal" />
      <header>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.15em] text-emerald-600">
          <FileText size={13} /> Your care
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[#1E293B]">Session notes</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Review the notes your therapist has shared with you.</p>
      </header>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {visibleNotes.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleNotes.map((note) => (
            <article key={note._id} className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
                  <LockKeyhole size={12} /> Shared note
                </span>
                <span className="text-xs text-[#94A3B8]">{new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="prose prose-sm mt-5 max-w-none text-[#64748B] prose-headings:text-[#1E293B] prose-strong:text-[#1E293B]" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(note.content) }} />
              <div className="mt-5 flex items-center gap-2 border-t border-[#E2E8F0] pt-4 text-xs text-[#94A3B8]">
                <Calendar size={13} /> Shared on {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[26px] border border-dashed border-[#DDE5E1] bg-white p-10 text-center shadow-sm">
          <FileText className="mx-auto text-emerald-500" size={24} />
          <h2 className="mt-4 text-sm font-bold text-[#1E293B]">No shared notes yet</h2>
          <p className="mt-1 text-sm text-[#64748B]">Notes shared by your therapist will appear here.</p>
        </div>
      )}
    </section>
  )
}
