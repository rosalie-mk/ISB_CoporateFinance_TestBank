import React, { useEffect, useMemo, useState } from 'react'
import Quiz from './components/Quiz'

const STORAGE_KEYS = {
  chapter: 'chapter',
  dark: 'dark',
}
const LAST_CHAPTER = 32
const CHAPTERS = Array.from({ length: 31 }, (_, index) => index + 1)

function getLocalStorageValue(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : stored
  } catch {
    return fallback
  }
}

function getLocalStorageNumber(key, fallback) {
  const value = getLocalStorageValue(key, null)
  const number = Number(value)
  return Number.isFinite(number) && number >= 1 ? number : fallback
}

function setLocalStorageValue(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore write failures in private browsing or restricted storage.
  }
}

export default function App() {
  const [allQuestions, setAllQuestions] = useState([])
  const [chapter, setChapter] = useState(() => getLocalStorageNumber(STORAGE_KEYS.chapter, 1))
  const [dark, setDark] = useState(() => getLocalStorageValue(STORAGE_KEYS.dark, '0') === '1')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    setLocalStorageValue(STORAGE_KEYS.dark, dark ? '1' : '0')
  }, [dark])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/allQuestions.json`)
      .then((response) => response.json())
      .then(setAllQuestions)
      .catch((error) => {
        console.error('Unable to load questions:', error)
      })
  }, [])

  useEffect(() => {
    setLocalStorageValue(STORAGE_KEYS.chapter, String(chapter))
  }, [chapter])

  const filteredQuestions = useMemo(() => {
    if (!allQuestions.length) return []
    if (chapter === LAST_CHAPTER) return allQuestions
    return allQuestions.filter((question) => question.chapter === chapter)
  }, [allQuestions, chapter])

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Corporate Finance</p>
          <h1>Corporate Finance — Study</h1>
        </div>
        <button type="button" className="themeToggle" onClick={() => setDark((current) => !current)}>
          {dark ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </header>

      <nav className="tabs" aria-label="Chapter navigation">
        {CHAPTERS.map((chapterNumber) => (
          <button
            key={chapterNumber}
            type="button"
            className={chapter === chapterNumber ? 'active' : ''}
            aria-pressed={chapter === chapterNumber}
            onClick={() => setChapter(chapterNumber)}
          >
            Chapter {chapterNumber}
          </button>
        ))}

        <button
          type="button"
          className={chapter === LAST_CHAPTER ? 'active' : ''}
          aria-pressed={chapter === LAST_CHAPTER}
          onClick={() => setChapter(LAST_CHAPTER)}
        >
          All Chapters
        </button>
      </nav>

      <main className="mainContent">
        <Quiz questions={filteredQuestions} chapter={chapter} />
      </main>

      <footer className="footer">Generated from full_text.txt — questions: {allQuestions.length}</footer>
    </div>
  )
}
