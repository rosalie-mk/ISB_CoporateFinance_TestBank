import React, { useEffect, useState, useMemo } from 'react'
import Quiz from './components/Quiz'

const CH_COUNT = 32 // 1..31 plus All

export default function App(){
  const [allQuestions, setAllQuestions] = useState([])
  const [chapter, setChapter] = useState(() => parseInt(localStorage.getItem('chapter')||'1'))
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === '1')

  useEffect(()=>{ if(dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); localStorage.setItem('dark', dark? '1':'0') },[dark])

  useEffect(()=>{
    fetch('/data/allQuestions.json').then(r=>r.json()).then(setAllQuestions)
  },[])

  useEffect(()=>{ localStorage.setItem('chapter', String(chapter)) },[chapter])

  const chapters = useMemo(()=>{
    const arr = []
    for(let i=1;i<=31;i++) arr.push(i)
    return arr
  },[])

  const filtered = useMemo(()=>{
    if(!allQuestions.length) return []
    if(chapter===32) return allQuestions
    return allQuestions.filter(q=>q.chapter===chapter)
  },[allQuestions, chapter])

  return (
    <div className="app">
      <header className="topbar">
        <h1>Corporate Finance — Study</h1>
        <div>
          <button onClick={()=>setDark(d=>!d)}>{dark? 'Light':'Dark'}</button>
        </div>
      </header>

      <nav className="tabs">
        {chapters.map(ch=> (
          <button key={ch} className={chapter===ch? 'active':''} onClick={()=>setChapter(ch)}>Chapter {ch}</button>
        ))}
        <button className={chapter===32? 'active':''} onClick={()=>setChapter(32)}>All Chapters</button>
      </nav>

      <main>
        <Quiz questions={filtered} chapter={chapter} />
      </main>

      <footer className="footer">Generated from full_text.txt — questions: {allQuestions.length}</footer>
    </div>
  )
}
