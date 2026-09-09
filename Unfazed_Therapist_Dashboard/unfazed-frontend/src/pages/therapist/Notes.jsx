import {
  Bold,
  Italic,
  List,
  Save,
  Users,
  Calendar,
  FileText,
  Lock,
  Unlock,
  Sparkles,
  Clock3,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import axiosInstance from '../../api/axiosInstance'
import UpgradePrompt from '../../components/common/UpgradePrompt'
import PageBackButton from '../../components/common/PageBackButton'

const templates = {
  freeform: '<p>Start writing your session note...</p>',
  SOAP: '<h3>Subjective</h3><p></p><h3>Objective</h3><p></p><h3>Assessment</h3><p></p><h3>Plan</h3><p></p>',
  DAP: '<h3>Data</h3><p></p><h3>Assessment</h3><p></p><h3>Plan</h3><p></p>',
}

function plainText(content) {
  return String(content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isTemplateOnly(note) {
  return (
    ['SOAP', 'DAP'].includes(note.format) &&
    plainText(note.content) === plainText(templates[note.format])
  )
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
        class:
          'min-h-[360px] rounded-b-2xl bg-[#F8FAFC] px-5 py-5 text-[15px] leading-7 text-[#1E293B] outline-none sm:px-7 sm:py-6',
      },
    },
  })

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/clients'),
      axiosInstance.get('/scheduling/sessions'),
      axiosInstance.get('/notes'),
    ])
      .then(([clientResponse, sessionResponse, noteResponse]) => {
        setClients(clientResponse.data.clients || [])
        setSessions(sessionResponse.data.sessions || [])
        setNotes(noteResponse.data.notes || [])
      })
      .catch((error) =>
        setMessage(
          error.response?.data?.message || 'Unable to load notes.'
        )
      )
  }, [])

  function selectFormat(value) {
    setFormat(value)
    editor?.commands.setContent(templates[value])
  }

  async function saveNote(event) {
    event.preventDefault()

    const noteText = editor?.getText().trim() || ''
    const untouchedTemplate = plainText(templates[format])

    if (
      !editor ||
      !clientId ||
      !sessionId ||
      noteText.length < 1 ||
      noteText === untouchedTemplate
    ) {
      setMessage('Choose a client, session, and add note content.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const { data } = await axiosInstance.post('/notes', {
        client_id: clientId,
        session_id: sessionId,
        type,
        format,
        content: editor.getHTML(),
      })

      setNotes((current) => [data.note, ...current])

      setMessage(
        `${type === 'private' ? 'Private' : 'Shared'} note saved successfully.`
      )

      editor.commands.setContent(templates[format])
    } catch (error) {
      setUpgradeBlocked(
        error.response?.status === 403 &&
          error.response?.data?.upgradeRequired
      )

      setMessage(
        error.response?.data?.message || 'Unable to save note.'
      )
    } finally {
      setSaving(false)
    }
  }

  const clientSessions = sessions.filter(
    (session) =>
      !clientId ||
      String(session.client_id?._id || session.client_id) ===
        String(clientId)
  )

  const visibleNotes = notes.filter(
    (note) => !isTemplateOnly(note)
  )

  const totalNotes = visibleNotes.length

  const selectedClient = clients.find(
    (client) => String(client._id) === String(clientId)
  )

  return (
    <section className="mx-auto max-w-[1440px] space-y-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <PageBackButton
        to="/dashboard"
        label="Back to dashboard"
      />

      {/* Header */}
      <header className="animate-[fadeIn_.35s_ease-out]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-violet-600">
              <FileText size={13} />
              Clinical workspace
            </div>

            <h1 className="font-display text-4xl font-semibold tracking-[-.035em] text-[#1E293B] sm:text-5xl">
              Session notes
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
              Document your sessions clearly and securely. Private notes
              remain therapist-only, while shared notes are visible in the
              client portal.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1E293B]">
                Secure workspace
              </p>
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                Your notes are protected
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Feedback */}
      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 shadow-sm">
          <Sparkles size={17} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main workspace */}
      <form
        onSubmit={saveNote}
        className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(30,41,59,0.06)] transition-shadow duration-300 hover:shadow-[0_24px_80px_rgba(30,41,59,0.08)]"
      >
        {/* Workspace header */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 via-white to-white px-6 py-6 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">
                New note
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                Document a session
              </h2>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#64748B] shadow-sm ring-1 ring-slate-100">
              <Lock size={14} className="text-violet-500" />
              Clinical documentation
            </div>
          </div>
        </div>

        {/* Client + session */}
        <div className="grid gap-5 px-6 pt-7 sm:grid-cols-2 sm:px-8">
          <label className="group">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1E293B]">
              <Users size={15} className="text-violet-500" />
              Client
            </span>

            <select
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value)
                setSessionId('')
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-medium text-[#1E293B] outline-none transition-all duration-200 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="">Choose client</option>

              {clients.map((client) => (
                <option
                  key={client._id}
                  value={client._id}
                >
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="group">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1E293B]">
              <Calendar size={15} className="text-violet-500" />
              Session
            </span>

            <select
              value={sessionId}
              onChange={(event) =>
                setSessionId(event.target.value)
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-medium text-[#1E293B] outline-none transition-all duration-200 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="">Choose session</option>

              {clientSessions.map((session) => (
                <option
                  key={session._id}
                  value={session._id}
                >
                  {new Date(session.starts_at).toLocaleString()} ·{' '}
                  {session.status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Selected client helper */}
        {selectedClient && (
          <div className="mx-6 mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 sm:mx-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
              {selectedClient.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-bold text-[#1E293B]">
                {selectedClient.name}
              </p>
              <p className="text-xs text-[#64748B]">
                {selectedClient.email || 'Client record'}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:px-8">
          {/* Editor tools */}
          <div className="flex w-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleBold().run()
              }
              className={`flex h-11 w-11 items-center justify-center transition-colors ${
                editor?.isActive('bold')
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]'
              }`}
              aria-label="Bold"
            >
              <Bold size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleItalic().run()
              }
              className={`flex h-11 w-11 items-center justify-center border-l border-slate-100 transition-colors ${
                editor?.isActive('italic')
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]'
              }`}
              aria-label="Italic"
            >
              <Italic size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleBulletList().run()
              }
              className={`flex h-11 w-11 items-center justify-center border-l border-slate-100 transition-colors ${
                editor?.isActive('bulletList')
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]'
              }`}
              aria-label="Bullet list"
            >
              <List size={17} />
            </button>
          </div>

          {/* Template */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold uppercase tracking-wider text-[#94A3B8] sm:block">
              Format
            </span>

            <select
              value={format}
              onChange={(event) =>
                selectFormat(event.target.value)
              }
              className="h-11 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#1E293B] outline-none transition-all duration-200 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="freeform">Freeform</option>
              <option value="SOAP">SOAP template</option>
              <option value="DAP">DAP template</option>
            </select>
          </div>

          {/* Visibility */}
          <div className="sm:ml-auto">
            <div className="inline-flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setType('private')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                  type === 'private'
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Lock size={14} />
                Private
              </button>

              <button
                type="button"
                onClick={() => setType('shared')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                  type === 'shared'
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Unlock size={14} />
                Shared
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="mx-6 mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC] sm:mx-8">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-violet-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Note content
              </span>
            </div>

            <span className="text-[11px] font-medium text-[#94A3B8]">
              {format === 'freeform'
                ? 'Freeform'
                : `${format} template`}
            </span>
          </div>

          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div className="flex flex-col justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            {type === 'private' ? (
              <>
                <Lock size={14} className="text-violet-500" />
                Only you can view this note.
              </>
            ) : (
              <>
                <Unlock size={14} className="text-violet-500" />
                This note will be visible to the client.
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={!editor || saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-500 px-7 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
          >
            <Save size={16} />

            {saving ? 'Saving note...' : 'Save note'}
          </button>
        </div>
      </form>

      {/* Saved notes */}
      <section>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">
              Your records
            </p>

            <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.025em] text-[#1E293B]">
              Saved notes
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              {totalNotes} note{totalNotes !== 1 ? 's' : ''} saved
              in your workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <Clock3 size={14} />
            Recently created notes appear first
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleNotes.map((note) => (
            <article
              key={note._id}
              tabIndex="0"
              className="group relative rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:z-10 hover:scale-[1.03] hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_20px_46px_rgba(30,41,59,0.14)] focus:z-10 focus:scale-[1.03] focus:-translate-y-1 focus:border-violet-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:shadow-[0_20px_46px_rgba(30,41,59,0.14)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    note.type === 'shared'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {note.type === 'shared' ? (
                    <Unlock size={12} />
                  ) : (
                    <Lock size={12} />
                  )}

                  {note.type}
                </span>

                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  {note.format}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                  <FileText size={17} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1E293B]">
                    Session note
                  </p>

                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {note.createdAt
                      ? new Date(
                          note.createdAt
                        ).toLocaleDateString()
                      : 'Recently created'}
                  </p>
                </div>
              </div>

              <p className="mt-5 max-h-0 overflow-hidden text-sm leading-6 text-[#64748B] opacity-0 transition-all duration-300 ease-out group-hover:max-h-32 group-hover:opacity-100 group-focus:max-h-32 group-focus:opacity-100">
                {plainText(note.content)}
              </p>

              <div className="mt-0 max-h-0 overflow-hidden border-t border-slate-100 pt-0 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:mt-5 group-hover:max-h-16 group-hover:pt-4 group-hover:opacity-100 group-focus:mt-5 group-focus:max-h-16 group-focus:pt-4 group-focus:opacity-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#94A3B8]">
                    Visibility
                  </span>

                  <span className="flex items-center gap-1.5 font-bold capitalize text-[#64748B]">
                    {note.type === 'shared' ? (
                      <Unlock size={12} />
                    ) : (
                      <Lock size={12} />
                    )}

                    {note.type}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!visibleNotes.length && (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
              <FileText size={21} />
            </div>

            <h3 className="mt-4 font-display text-lg font-semibold text-[#1E293B]">
              No notes yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#64748B]">
              Once you save your first session note, it will appear here
              for quick access.
            </p>
          </div>
        )}
      </section>

      {/* Upgrade */}
      {upgradeBlocked && <UpgradePrompt />}
    </section>
  )
}
