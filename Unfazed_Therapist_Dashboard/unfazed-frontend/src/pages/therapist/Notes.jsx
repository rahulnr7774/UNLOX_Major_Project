import { Bold, Italic, List, Save, Users, Calendar, FileText, Lock, Unlock, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import axiosInstance from '../../api/axiosInstance'
import UpgradePrompt from '../../components/common/UpgradePrompt'

const templates = {
  freeform: '<p>Start writing your session note...</p>',
  SOAP: '<h3>Subjective</h3><p></p><h3>Objective</h3><p></p><h3>Assessment</h3><p></p><h3>Plan</h3><p></p>',
  DAP: '<h3>Data</h3><p></p><h3>Assessment</h3><p></p><h3>Plan</h3><p></p>'
}

function plainText(content) {
  return String(content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function isTemplateOnly(note) {
  return ['SOAP', 'DAP'].includes(note.format) && plainText(note.content) === plainText(templates[note.format])
}

export default function Notes() {
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState([])
  const [notes, setNotes] = useState([])
  const [clientId, setClientId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [type, setType] = useState('private')
  const [format, setFormat] = useState('freeform')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [upgradeBlocked, setUpgradeBlocked] = useState(false)
  const editor = useEditor({
    extensions: [StarterKit],
    content: templates.freeform,
    editorProps: {
      attributes: {
        class: 'min-h-64 rounded-b-2xl border border-slate-200 bg-[#F8FAFC] p-5 text-sm leading-7 text-[#1E293B] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
      }
    }
  })

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/clients'),
      axiosInstance.get('/scheduling/sessions'),
      axiosInstance.get('/notes')
    ])
      .then(([clientResponse, sessionResponse, noteResponse]) => {
        setClients(clientResponse.data.clients || [])
        setSessions(sessionResponse.data.sessions || [])
        setNotes(noteResponse.data.notes || [])
      })
      .catch((error) => setMessage(error.response?.data?.message || 'Unable to load notes.'))
  }, [])

  function selectFormat(value) {
    setFormat(value)
    editor?.commands.setContent(templates[value])
  }

  async function saveNote(event) {
    event.preventDefault()
    const noteText = editor?.getText().trim() || ''
    const untouchedTemplate = plainText(templates[format])
    if (!editor || !clientId || !sessionId || noteText.length < 1 || noteText === untouchedTemplate) {
      setMessage('Choose a client, session, and add note content.')
      return
    }
    setSaving(true)
    try {
      const { data } = await axiosInstance.post('/notes', {
        client_id: clientId,
        session_id: sessionId,
        type,
        format,
        content: editor.getHTML()
      })
      setNotes((current) => [data.note, ...current])
      setMessage(`${type === 'private' ? 'Private' : 'Shared'} note saved.`)
      editor.commands.setContent(templates[format])
    } catch (error) {
      setUpgradeBlocked(error.response?.status === 403 && error.response?.data?.upgradeRequired)
      setMessage(error.response?.data?.message || 'Unable to save note.')
    } finally {
      setSaving(false)
    }
  }

  const clientSessions = sessions.filter((session) =>
    !clientId || String(session.client_id?._id || session.client_id) === String(clientId)
  )
  const visibleNotes = notes.filter((note) => !isTemplateOnly(note))
  const totalNotes = visibleNotes.length

  return (
    <section className="mx-auto max-w-[1440px] space-y-10 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <header>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-violet-600">Clinical workspace</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#1E293B]">Session notes</h1>
        <p className="mt-2 text-[#64748B]">
          Private notes stay therapist-only. Shared notes are the only notes available in the client portal.
        </p>
      </header>

      {message && (
        <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
          {message}
        </p>
      )}

      {/* Note form */}
      <form onSubmit={saveNote} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1E293B]">Client</span>
            <select
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value)
                setSessionId('')
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Choose client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-[#1E293B]">Session</span>
            <select
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Choose session</option>
              {clientSessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {new Date(session.starts_at).toLocaleString()} · {session.status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {/* Editor toolbar */}
          <div className="flex overflow-hidden rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className="p-3 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
              aria-label="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className="p-3 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
              aria-label="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className="p-3 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
              aria-label="Bullet list"
            >
              <List size={16} />
            </button>
          </div>

          <select
            value={format}
            onChange={(event) => selectFormat(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-semibold text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value="freeform">Freeform</option>
            <option value="SOAP">SOAP template</option>
            <option value="DAP">DAP template</option>
          </select>

          <div className="ml-auto flex rounded-xl bg-[#F8FAFC] p-1">
            <button
              type="button"
              onClick={() => setType('private')}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                type === 'private'
                  ? 'bg-violet-500 text-white'
                  : 'text-[#64748B] hover:bg-slate-200'
              }`}
            >
              <Lock size={14} /> Private
            </button>
            <button
              type="button"
              onClick={() => setType('shared')}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                type === 'shared'
                  ? 'bg-violet-500 text-white'
                  : 'text-[#64748B] hover:bg-slate-200'
              }`}
            >
              <Unlock size={14} /> Shared
            </button>
          </div>
        </div>

        <div className="mt-3">
          <EditorContent editor={editor} />
        </div>

        <button
          type="submit"
          disabled={!editor || saving}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-600 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save note'}
        </button>
      </form>

      {/* Saved notes */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Saved notes</h2>
            <p className="mt-1 text-sm text-[#64748B]">{totalNotes} note{totalNotes !== 1 ? 's' : ''} saved</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visibleNotes.map((note) => (
            <article key={note._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    note.type === 'shared'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {note.type === 'shared' ? <Unlock size={12} className="inline mr-1" /> : <Lock size={12} className="inline mr-1" />}
                  {note.type}
                </span>
                <span className="text-xs text-[#64748B]">{note.format}</span>
              </div>
              <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#64748B]">
                {plainText(note.content)}
              </p>
            </article>
          ))}
        </div>
        {!visibleNotes.length && (
          <p className="mt-4 text-sm text-[#64748B]">No notes yet.</p>
        )}
      </section>

      {upgradeBlocked && <UpgradePrompt />}
    </section>
  )
}