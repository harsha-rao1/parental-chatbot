import { useMemo, useState } from 'react'
import './App.css'

const topicCards = [
  {
    label: 'Understanding my child’s diagnosis',
    prompt:
      'Help me understand what an autism diagnosis means in plain language, based on DSM-5 summaries.',
  },
  {
    label: 'School & education basics',
    prompt:
      'What should I know about supporting my child at school after an autism diagnosis?',
  },
  {
    label: 'Communication & behavior support',
    prompt:
      'How can I support my child’s communication and behavior in daily routines?',
  },
  {
    label: 'Trusted academic resources',
    prompt:
      'Share trusted academic and institution-approved resources on autism I can read next.',
  },
  {
    label: 'What this assistant can and can’t do',
    prompt:
      'Explain the limits: this tool is educational, non-diagnostic, and uses approved sources only.',
  },
]

const academicSources = [
  'DSM-5 (summary, non-diagnostic)',
  'CDC: Autism Overview',
  'Autism Speaks School Community Tool Kit',
  'Peer-reviewed research (varies by topic)',
  'Institution-approved family education handouts',
]

const emotionalKeywords = ['scared', 'overwhelmed', 'worried', 'lost', 'anxious']
const safetyTriggers = [
  'diagnose',
  'diagnosis me',
  'will my child',
  'cure',
  'guarantee',
  'predict',
  'medication advice',
]

const suggestionCatalog = {
  diagnosis: ['Autism myths vs facts', 'How autism can present differently', 'Collaborating with clinicians'],
  school: ['Preparing for IEP/504 conversations', 'Sensory supports in classrooms', 'Partnering with teachers'],
  communication: ['Visual supports and routines', 'Building communication opportunities', 'Responding to meltdowns with safety'],
  resources: ['Downloadable checklists for new parents', 'Evidence-based parent training programs', 'Support groups and helplines'],
  guardrails: ['What I can and cannot answer', 'How we choose sources', 'How to ask safer questions'],
  general: ['Understanding sensory sensitivities', 'Planning the next 30 days', 'Finding local services (use approved directories)'],
}

const answersByTopic = {
  diagnosis:
    'An autism diagnosis describes differences in social communication and patterns of behavior. It is not a value judgment and does not predict a child’s future. Support focuses on creating predictable routines, communication pathways, and sensory-friendly environments. Always partner with your clinical team for decisions.',
  school:
    'Let the school know you want to collaborate. Ask about supports such as visual schedules, sensory breaks, clear routines, and predictable transitions. If available, request an IEP/504 meeting to discuss accommodations. Share what works at home to help staff respond consistently.',
  communication:
    'Start with your child’s strengths. Use clear, concrete language, visuals, and consistent routines. Offer communication options—gestures, pictures, AAC if recommended by clinicians. Reinforce attempts to communicate, and keep transitions predictable to reduce stress.',
  resources:
    'Here are trusted, non-diagnostic resources: CDC Autism Overview for foundational education; DSM-5 summaries for terminology; Autism Speaks School Community Tool Kit for school collaboration; peer-reviewed research on communication supports; and your institution’s approved parent handouts for local guidance.',
  guardrails:
    'This assistant is educational and knowledge-bound. It does not diagnose, predict outcomes, or replace clinical care. It uses DSM-5 summaries, CDC content, peer-reviewed research, and institution-approved materials. If a question falls outside scope, it will say so and redirect you to safer topics.',
  general:
    'Great question. I can help with educational guidance, trustworthy resources, and planning next steps. I cannot provide medical advice or predict outcomes. Let’s focus on evidence-based supports you can discuss with your care team.',
}

function buildAssistantReply(promptText) {
  const normalized = promptText.toLowerCase()
  const emotional = emotionalKeywords.find((kw) => normalized.includes(kw))
  const emotionalPrefix = emotional
    ? 'Many parents feel this way after a diagnosis. You’re asking an important question. '
    : ''

  const scopeBlocked = safetyTriggers.some((kw) => normalized.includes(kw))
  if (scopeBlocked) {
    return {
      text:
        emotionalPrefix +
        "I can’t predict outcomes, diagnose, or give medical advice. I can explain what research says and how to work with your clinical team. Would you like information on communication supports, school planning, or trusted resources?",
      sources: academicSources.slice(0, 3),
      badge: 'Knowledge-Bound Safe Response',
      suggestions: suggestionCatalog.guardrails,
      scopeLimited: true,
    }
  }

  let topic = 'general'
  if (normalized.includes('diagnosis') || normalized.includes('diagnosed')) topic = 'diagnosis'
  else if (normalized.includes('school')) topic = 'school'
  else if (normalized.includes('communication') || normalized.includes('behavior')) topic = 'communication'
  else if (normalized.includes('resource')) topic = 'resources'
  else if (normalized.includes('limit') || normalized.includes('scope')) topic = 'guardrails'

  return {
    text: emotionalPrefix + (answersByTopic[topic] ?? answersByTopic.general),
    sources: academicSources,
    badge: topic === 'guardrails' ? 'Knowledge-Bound' : 'Evidence-Based',
    suggestions: suggestionCatalog[topic] ?? suggestionCatalog.general,
    scopeLimited: false,
  }
}

function Message({ role, text, meta }) {
  return (
    <div className={`message ${role}`}>
      <div className="message-header">
        <span className="role">{role === 'assistant' ? 'Navigator' : 'You'}</span>
        {role === 'assistant' && meta?.badge && <span className="badge">{meta.badge}</span>}
      </div>
      <p className="message-text">{text}</p>
      {role === 'assistant' && (
        <div className="message-footer">
          <details className="sources">
            <summary>Sources used</summary>
            <ul>
              {(meta?.sources ?? []).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="why-source">Why these? They are institution-approved, non-diagnostic.</div>
          </details>
          <div className="suggestions">
            <div className="suggestions-title">Recommended next topics</div>
            <div className="chips">
              {(meta?.suggestions ?? []).map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Welcome. I’m an evidence-bound support assistant for parents after an autism diagnosis. I share educational guidance only, using institution-approved sources, and I always show what I’m citing.',
      meta: {
        badge: 'Knowledge-Bound Response',
        sources: academicSources,
        suggestions: suggestionCatalog.general,
      },
    },
  ])

  const handleSend = (value) => {
    if (!value.trim()) return
    const reply = buildAssistantReply(value)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: value },
      { role: 'assistant', text: reply.text, meta: reply },
    ])
    setInput('')
  }

  const safeDemoPrompt = useMemo(
    () => 'Can you tell me if my child will ever live independently?',
    [],
  )

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Post-Diagnosis Autism Support Navigator</p>
          <h1>
            Evidence-bound guidance for parents,
            <span className="accent"> never diagnostic</span>.
          </h1>
          <p className="lede">
            Built on DSM-5 summaries, academic resources, and institution-approved content. Every
            answer shows its sources and stays within defined educational boundaries.
          </p>
          <div className="badges">
            <span className="pill">🔒 Knowledge-bound</span>
            <span className="pill">📘 Educational only</span>
            <span className="pill">🧭 Guided experience</span>
            <span className="pill">🛡️ Safe failure mode</span>
          </div>
        </div>
        <div className="cta-panel">
          <div className="cta-title">Live demo script</div>
          <ol>
            <li>Select a topic card (guided entry)</li>
            <li>Ask a helpful question (see sources)</li>
            <li>Ask a risky question to trigger safe failure</li>
          </ol>
          <button className="primary" onClick={() => handleSend(safeDemoPrompt)}>
            Run the safe-failure demo
          </button>
          <div className="disclaimer">
            This assistant is for education, not diagnosis or clinical advice.
          </div>
        </div>
      </header>

      <section className="card-grid">
        {topicCards.map((card) => (
          <button
            key={card.label}
            className="topic-card"
            onClick={() => handleSend(card.prompt)}
            type="button"
          >
            <div className="card-title">{card.label}</div>
            <p>{card.prompt}</p>
            <span className="card-cta">Try it →</span>
          </button>
        ))}
      </section>

      <main className="chat-area">
        <div className="chat-header">
          <div>
            <div className="chat-title">Conversation</div>
            <p className="chat-subtitle">
              Every reply is scoped, cited, and prefaced with emotional safety when needed.
            </p>
          </div>
          <div className="indicator">
            <span className="dot" />
            Knowledge-bound mode active
          </div>
        </div>

        <div className="chat-window">
          {messages.map((m, idx) => (
            <Message key={idx} role={m.role} text={m.text} meta={m.meta} />
          ))}
        </div>

        <div className="composer">
          <input
            value={input}
            placeholder="Ask an educational question (e.g., How can I prep for school meetings?)"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(input)
              }
            }}
          />
          <button className="primary" type="button" onClick={() => handleSend(input)}>
            Send
          </button>
        </div>
      </main>

      <footer className="footer">
        <div>
          <div className="footer-title">Auditable & institution-ready</div>
          <p>
            Responses cite DSM-5 summaries, CDC autism content, peer-reviewed research, and
            institution-approved family education materials. The assistant refuses out-of-scope
            questions by design.
          </p>
        </div>
        <div className="footer-links">
          <span>Educational only</span>
          <span>Sources transparent</span>
          <span>Scope-aware</span>
        </div>
      </footer>
    </div>
  )
}

export default App
