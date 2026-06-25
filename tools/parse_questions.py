import re
import json
from pathlib import Path


def parse(full_text_path):
    text = Path(full_text_path).read_text(encoding='utf-8')
    lines = text.splitlines()

    chapter_re = re.compile(r'Chapter\s+(\d+)')
    qstart_re = re.compile(r'^(\d+)\)\s*(.*)')
    option_re = re.compile(r'^([A-E])\)\s*(.*)')
    answer_re = re.compile(r'^Answer:\s*(.*)')
    explanation_re = re.compile(r'^Explanation:\s*(.*)')

    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)

    chapters = {}
    all_questions = []
    current_chapter = None

    i = 0
    qid = 1
    while i < len(lines):
        line = lines[i].strip()
        # Detect chapter header
        m = chapter_re.search(line)
        if m:
            current_chapter = int(m.group(1))
            if current_chapter not in chapters:
                chapters[current_chapter] = []
            i += 1
            continue

        m = qstart_re.match(line)
        if m and current_chapter is not None:
            # parse question
            num = m.group(1)
            qtext = m.group(2).strip()
            # collect following lines until option A)
            i += 1
            while i < len(lines) and not option_re.match(lines[i].strip()):
                qline = lines[i].rstrip()
                if qline.strip() == '':
                    i += 1
                    continue
                qtext += ' ' + qline.strip()
                i += 1

            options = {k: '' for k in list('ABCDE')}
            # parse options
            while i < len(lines):
                lm = option_re.match(lines[i].strip())
                if not lm:
                    break
                key = lm.group(1)
                val = lm.group(2).strip()
                # options are single-line in these files; if following lines are indented, append
                i += 1
                while i < len(lines) and lines[i].startswith('    '):
                    val += ' ' + lines[i].strip()
                    i += 1
                options[key] = val

            # parse Answer and optional Explanation
            answer = ''
            explanation = ''
            # skip blank lines
            while i < len(lines) and lines[i].strip() == '':
                i += 1
            if i < len(lines) and answer_re.match(lines[i].strip()):
                am = answer_re.match(lines[i].strip())
                answer = am.group(1).strip()
                i += 1
                # collect Explanation if present
                while i < len(lines) and lines[i].strip() == '':
                    i += 1
                if i < len(lines) and explanation_re.match(lines[i].strip()):
                    em = explanation_re.match(lines[i].strip())
                    explanation = em.group(1).strip()
                    i += 1
                    # gather following explanation lines until blank line
                    while i < len(lines) and lines[i].strip() != '':
                        explanation += ' ' + lines[i].strip()
                        i += 1

            qobj = {
                'id': qid,
                'chapter': current_chapter,
                'question': qtext.strip(),
                'options': {
                    'A': options.get('A','').strip(),
                    'B': options.get('B','').strip(),
                    'C': options.get('C','').strip(),
                    'D': options.get('D','').strip(),
                    'E': options.get('E','').strip(),
                },
                'answer': answer.strip(),
            }
            if explanation:
                qobj['explanation'] = explanation.strip()

            chapters.setdefault(current_chapter, []).append(qobj)
            all_questions.append(qobj)
            qid += 1
            continue

        i += 1

    # write per-chapter json files for chapters 1..31
    for ch in range(1, 32):
        arr = chapters.get(ch, [])
        fname = data_dir / f'chapter{ch}.json'
        fname.write_text(json.dumps(arr, indent=2, ensure_ascii=False))

    # allQuestions
    (data_dir / 'allQuestions.json').write_text(json.dumps(all_questions, indent=2, ensure_ascii=False))

    print(f'Wrote {len(all_questions)} questions to {data_dir}/allQuestions.json and chapter files.')


if __name__ == '__main__':
    import sys
    p = sys.argv[1] if len(sys.argv) > 1 else 'full_text.txt'
    parse(p)
