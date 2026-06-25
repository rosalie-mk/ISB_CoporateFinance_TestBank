import re
import json
from pathlib import Path


def split_into_chapters(text):
    # Find chapter headers and split into blocks
    chap_re = re.compile(r'(?m)^Chapter\s+(\d+)\b')
    matches = list(chap_re.finditer(text))
    chapters = {}
    for idx, m in enumerate(matches):
        ch_num = int(m.group(1))
        start = m.end()
        end = matches[idx+1].start() if idx+1 < len(matches) else len(text)
        block = text[start:end].strip()
        chapters[ch_num] = block
    return chapters


def parse_questions_from_chapter(block_text, start_id=1):
    # Find question start positions like '1)' or '1.' at line starts
    qstart_re = re.compile(r'(?m)^\s*(\d+)[\)\.]')
    option_re = re.compile(r'(?m)^\s*([A-E])\)\s*(.*)')
    answer_re = re.compile(r'(?mi)^\s*Answer:\s*([A-E])')
    explanation_re = re.compile(r'(?mi)^\s*Explanation:\s*(.*)')

    starts = list(qstart_re.finditer(block_text))
    questions = []
    qid = start_id
    for idx, m in enumerate(starts):
        qnum = m.group(1)
        qstart = m.end()
        qend = starts[idx+1].start() if idx+1 < len(starts) else len(block_text)
        qblock = block_text[qstart:qend].strip()

        # Extract options A-E by searching option markers inside qblock
        opts = {'A':'','B':'','C':'','D':'','E':''}
        opt_matches = list(option_re.finditer(qblock))
        if opt_matches:
            for j, om in enumerate(opt_matches):
                key = om.group(1)
                val_start = om.end()
                val_end = opt_matches[j+1].start() if j+1 < len(opt_matches) else len(qblock)
                val = qblock[val_start:val_end].strip()
                # Clean trailing newlines and section labels
                val = re.sub(r'\s+', ' ', val).strip()
                opts[key] = val
            # Question text is the part of qblock before first option
            qtext = qblock[:opt_matches[0].start()].strip()
        else:
            # No options found — treat entire block as question text
            qtext = qblock

        # Extract answer
        am = answer_re.search(qblock)
        answer = am.group(1).upper() if am else ''

        # Extract explanation if present
        em = explanation_re.search(qblock)
        explanation = em.group(1).strip() if em else ''

        question_obj = {
            'id': qid,
            'question': re.sub(r'\s+', ' ', qtext).strip(),
            'options': opts,
            'answer': answer,
        }
        if explanation:
            question_obj['explanation'] = re.sub(r'\s+', ' ', explanation).strip()

        questions.append(question_obj)
        qid += 1

    return questions


def parse(full_text_path):
    p = Path(full_text_path)
    if not p.exists():
        print('Input file not found:', full_text_path)
        return
    text = p.read_text(encoding='utf-8')

    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)

    chapters = split_into_chapters(text)

    all_questions = []
    next_id = 1
    counts = {}

    for ch in range(1, 32):
        block = chapters.get(ch, '')
        if not block:
            qlist = []
        else:
            qlist = parse_questions_from_chapter(block, start_id=next_id)
        # Annotate chapter field on each question and update id tracking
        for q in qlist:
            q['chapter'] = ch
        if qlist:
            next_id = qlist[-1]['id'] + 1

        counts[ch] = len(qlist)
        all_questions.extend(qlist)
        (data_dir / f'chapter{ch}.json').write_text(json.dumps(qlist, indent=2, ensure_ascii=False))

    (data_dir / 'allQuestions.json').write_text(json.dumps(all_questions, indent=2, ensure_ascii=False))

    total = len(all_questions)
    print('Per-chapter counts:')
    for ch in range(1, 32):
        print(f'Chapter {ch}: {counts.get(ch,0)}')
    print('Total questions:', total)

    return counts, total


if __name__ == '__main__':
    import sys
    p = sys.argv[1] if len(sys.argv) > 1 else 'full_text.txt'
    parse(p)
