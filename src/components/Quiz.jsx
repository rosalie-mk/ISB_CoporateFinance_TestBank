import React, { useEffect, useState, useMemo } from 'react'

function shuffleArray(a){
  const b = a.slice();
  for(let i=b.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]
  }
  return b
}

export default function Quiz({questions, chapter}){
  const [qset, setQset] = useState([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(() => JSON.parse(localStorage.getItem('answers')||'{}'))
  const [showAnswerOnSelect, setShowAnswerOnSelect] = useState(true)

  useEffect(()=>{ setIndex(0); setAnswers({}); localStorage.removeItem('answers') },[chapter])

  useEffect(()=>{ setQset(questions) },[questions])

  useEffect(()=>{ localStorage.setItem('answers', JSON.stringify(answers)) },[answers])

  const current = qset[index]

  function selectOption(qid, opt){
    setAnswers(prev => ({...prev, [qid]: opt}))
  }

  function shuffle(){ setQset(shuffleArray(qset)); setIndex(0); setAnswers({}); }

  function reset(){ setAnswers({}); setIndex(0); }

  const score = useMemo(()=>{
    let s=0, total=0
    for(const q of qset){ if(q.answer){ total++; if(answers[q.id] && answers[q.id].toUpperCase()===q.answer.toUpperCase()) s++ }}
    return {s,total}
  },[qset,answers])

  const percent = score.total? Math.round(100*score.s/score.total):0

  return (
    <div className="quiz">
      <div className="controls">
        <button onClick={shuffle}>Shuffle questions</button>
        <button onClick={reset}>Reset quiz</button>
        <label><input type="checkbox" checked={showAnswerOnSelect} onChange={e=>setShowAnswerOnSelect(e.target.checked)} /> Show answer immediately</label>
        <div className="score">Score: {score.s}/{score.total} ({percent}%)</div>
      </div>

      <div className="progressRow">
        <progress value={Object.keys(answers).length} max={qset.length||1}></progress>
        <div>{Object.keys(answers).length}/{qset.length} answered</div>
      </div>

      {current ? (
        <div className="questionCard">
          <div className="qHeader">{current.chapter ? `Chapter ${current.chapter}`:''} — Q {index+1}</div>
          <div className="qText">{current.question}</div>
          <div className="options">
            {Object.entries(current.options).map(([k,v])=> (
              <button key={k} onClick={()=>selectOption(current.id,k)} className={answers[current.id]===k? 'selected':''}>
                <strong>{k}.</strong> {v}
                {answers[current.id] && showAnswerOnSelect ? (
                  <span className={k===current.answer.trim() ? 'correct':'incorrect'}> {k===current.answer.trim()? ' ✓':' ✗'}</span>
                ):null}
              </button>
            ))}
          </div>

          {answers[current.id] && current.explanation ? (
            <div className="explain"><strong>Explanation:</strong> {current.explanation}</div>
          ): null}

          <div className="nav">
            <button onClick={()=>setIndex(i=>Math.max(0,i-1))}>Previous</button>
            <button onClick={()=>setIndex(i=>Math.min(qset.length-1,i+1))}>Next</button>
          </div>
        </div>
      ) : (
        <div className="empty">No questions for this chapter.</div>
      )}

      <div className="qList">
        {qset.map((q,i)=> (
          <button key={q.id} className={i===index? 'active':''} onClick={()=>setIndex(i)}>
            {i+1}{answers[q.id]? (answers[q.id]===q.answer? ' ✓':' ✗'):''}
          </button>
        ))}
      </div>
    </div>
  )
}
