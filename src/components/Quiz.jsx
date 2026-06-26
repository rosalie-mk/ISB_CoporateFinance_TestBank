import React, { useEffect, useMemo, useState } from 'react'

const STORAGE_KEYS = {
  answers: 'answers',
  wrongQuestions: 'wrongQuestions',
}

function safeJsonParse(value, fallback) {
  try {
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

function loadStorage(key, fallback) {
  try {
    return safeJsonParse(localStorage.getItem(key), fallback)
  } catch {
    return fallback
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Silent fail for browsers that disable localStorage.
  }
}

function normalizeAnswer(answer) {
  return String(answer ?? '').trim().toUpperCase()
}

function shuffleArray(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function filterQuestions(questions, tab, wrongIds) {
  return tab === 'wrong' ? questions.filter((question) => wrongIds.has(question.id)) : questions
}

function TabButton({ label, badge, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? 'active' : ''}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
      {badge !== undefined ? <span className="tabBadge">{badge}</span> : null}
    </button>
  )
}

function OptionButton({
  optionKey,
  optionText,
  selected,
  correct,
  wrong,
  disabled,
  showFeedback,
  onSelect,
}) {
  const className = [selected && 'selected', correct && 'correct-answer', wrong && 'wrong-answer']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(optionKey)}
      disabled={disabled}
      aria-pressed={selected}
    >
      <span className="optionLabel">
        <strong>{optionKey}.</strong> {optionText}
      </span>
      {showFeedback && (correct ? <span className="optionMarker correct">✓</span> : wrong ? <span className="optionMarker incorrect">✕</span> : null)}
    </button>
  )
}

function FeedbackPanel({ current, userAnswer, isCorrect }) {
  return (
    <section className="feedbackCard" aria-live="polite">
      <div className="feedbackTop">
        <div className={"feedbackBadge " + (isCorrect ? 'correct' : 'incorrect')}>
          {isCorrect ? '✓ Correct Answer' : '✕ Incorrect Answer'}
        </div>
        <div className="feedbackAnswerText">
          <div>
            <strong>Correct answer:</strong> {current.answer.trim()}
          </div>
          {userAnswer !== current.answer.trim() ? (
            <div className="yourAnswer">Your answer: {userAnswer}</div>
          ) : null}
        </div>
      </div>
      <div className="feedbackMeta">
        <div>
          <strong>Section:</strong> {current.section || 'N/A'}
        </div>
        <div>
          <strong>Topic:</strong> {current.topic || 'N/A'}
        </div>
        <div>
          <strong>Difficulty:</strong> {current.difficulty || 'N/A'}
        </div>
      </div>
      <div className="feedbackExplanation">
        <strong>Explanation:</strong>
        <div>{current.explanation ? current.explanation : 'No explanation available.'}</div>
      </div>
    </section>
  )
}

export default function Quiz({ questions, chapter }) {
  const [qset, setQset] = useState([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(() => loadStorage(STORAGE_KEYS.answers, {}))
  const [showAnswerOnSelect, setShowAnswerOnSelect] = useState(true)
  const [tab, setTab] = useState('all')
  const [wrongIds, setWrongIds] = useState(() => new Set(loadStorage(STORAGE_KEYS.wrongQuestions, [])))

  useEffect(() => {
    setQset(filterQuestions(questions, tab, wrongIds))
    }, [questions, tab, wrongIds])

useEffect(() => {
    setIndex(0)
    }, [questions, tab])

  useEffect(() => {
    setIndex(0)
    setAnswers({})
    saveStorage(STORAGE_KEYS.answers, {})
  }, [chapter])

  useEffect(() => {
    saveStorage(STORAGE_KEYS.answers, answers)
  }, [answers])

  useEffect(() => {
    saveStorage(STORAGE_KEYS.wrongQuestions, [...wrongIds])
  }, [wrongIds])

  useEffect(() => {
  if (qset.length > 0 && index >= qset.length) {
    setIndex(qset.length - 1)
    }
  }, [index, qset.length])

  const current = qset[index]
const userAnswer = current ? answers[current.id] : null

console.log({
  index,
  currentId: current?.id,
  question: current?.question,
  userAnswer,
})

const isCorrect = Boolean(userAnswer && normalizeAnswer(userAnswer) === normalizeAnswer(current?.answer))
  const allowRetry = tab === 'wrong' && userAnswer && current && !isCorrect
  const optionsDisabled = Boolean(userAnswer) && !allowRetry

  const answeredCount = useMemo(
    () => qset.reduce((count, question) => count + (answers[question.id] ? 1 : 0), 0),
    [qset, answers]
  )

  const score = useMemo(() => {
    let correct = 0
    let total = 0

    for (const question of qset) {
      if (!question.answer) continue
      total += 1
      if (answers[question.id] && normalizeAnswer(answers[question.id]) === normalizeAnswer(question.answer)) {
        correct += 1
      }
    }

    return { correct, total }
  }, [qset, answers])

  const percent = score.total ? Math.round((score.correct / score.total) * 100) : 0
  const wrongCount = wrongIds.size

  function updateAnswer(question, option) {
    const normalizedOption = normalizeAnswer(option)
    const normalizedCorrect = normalizeAnswer(question.answer)
    setAnswers((previous) => ({ ...previous, [question.id]: option }))

    setWrongIds((previous) => {
      const next = new Set(previous)
      if (normalizedOption === normalizedCorrect) {
        next.delete(question.id)
      } else {
        next.add(question.id)
      }
      return next
    })
  }

  function setActiveTab(nextTab) {
    setTab(nextTab)
    setIndex(0)
  }

  function shuffle() {
    setQset(shuffleArray(qset))
    setIndex(0)
    setAnswers({})
  }

  function reset() {
    setAnswers({})
    setIndex(0)
  }

  function clearWrong() {
    setWrongIds(new Set())
  }

  return (
    <div className="quiz">
      <div className="quizTabs" role="tablist" aria-label="Quiz tabs">
        <TabButton label="Questions" active={tab === 'all'} onClick={() => setActiveTab('all')} />
        <TabButton label="Wrong Questions" badge={wrongCount} active={tab === 'wrong'} onClick={() => setActiveTab('wrong')} />
      </div>

      <div className="controls" aria-label="Quiz controls">
        <button type="button" onClick={shuffle}>Shuffle questions</button>
        <button type="button" onClick={reset}>Reset quiz</button>
        <button type="button" className="clearWrong" onClick={clearWrong} disabled={!wrongCount}>
          Clear Wrong Questions
        </button>

        <label>
          <input
            type="checkbox"
            checked={showAnswerOnSelect}
            onChange={(event) => setShowAnswerOnSelect(event.target.checked)}
          />
          Show answer immediately
        </label>

        <div className="score" role="status" aria-live="polite">
          Score: {score.correct}/{score.total} ({percent}%)
        </div>
      </div>

      <div className="progressRow">
        <progress
          value={answeredCount}
          max={qset.length || 1}
          aria-label="Quiz progress"
        />
        <div>{answeredCount}/{qset.length} answered</div>
      </div>

      {current ? (
        <article className="questionCard">
          <div className="qHeader" aria-label={`Chapter ${current.chapter} question`}>Chapter {current.chapter} — Q {index + 1}</div>
          <div className="qText">{current.question}</div>

          <div className="options" role="group" aria-label="Answer choices">
            {Object.entries(current.options).map(([optionKey, optionText]) => {
              const correctOption = normalizeAnswer(optionKey) === normalizeAnswer(current.answer)
              const chosenWrong = userAnswer === optionKey && !correctOption
              const showFeedback = Boolean(userAnswer && showAnswerOnSelect)
              return (
                <OptionButton
                  key={optionKey}
                  optionKey={optionKey}
                  optionText={optionText}
                  selected={userAnswer === optionKey}
                  correct={Boolean(showFeedback && correctOption)}
                  wrong={Boolean(showFeedback && chosenWrong)}
                  showFeedback={showFeedback}
                  disabled={optionsDisabled}
                  onSelect={(option) => updateAnswer(current, option)}
                />
              )
            })}
          </div>

          {userAnswer ? (
            <FeedbackPanel current={current} userAnswer={userAnswer} isCorrect={isCorrect} />
          ) : null}

          <div className="nav">
            <button type="button" onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>
              Previous
            </button>
            <button type="button" onClick={() => setIndex((prev) => Math.min(qset.length - 1, prev + 1))}>
              Next
            </button>
          </div>
        </article>
      ) : (
        <div className="empty">No questions for this chapter.</div>
      )}

      <div className="qList" role="navigation" aria-label="Question navigation">
        {qset.map((question, questionIndex) => (
          <button
            key={question.id}
            type="button"
            className={questionIndex === index ? 'active' : ''}
            aria-pressed={questionIndex === index}
            onClick={() => setIndex(questionIndex)}
          >
            {questionIndex + 1}
            {answers[question.id]
              ? normalizeAnswer(answers[question.id]) === normalizeAnswer(question.answer)
                ? ' ✓'
                : ' ✗'
              : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
