"""
Third pass: the last two categories that were still generic.

- Nodes sourced from a .md file other than CLAUDE.md (README, GRAPH_REPORT,
  .claude/CLAUDE.md) got only "Defined in X". They now quote the nearest
  heading and its opening lines.
- `rationale` nodes are recorded design rationale lifted from a code comment.
  They now quote the whole comment rather than showing one truncated line as
  if it were a signature.
"""

from __future__ import annotations

import glob
import os
import re

ROOT = 'C:/Users/Admin/Documents/GitHub/OctetoWeb'
VAULT = os.path.join(ROOT, 'graphify-out/obsidian')
BEGIN, END = '<!-- context:begin -->', '<!-- context:end -->'

MD_ROLE = {
    'README.md': 'The repository README — how to run the project, and the '
                 'rules that are easy to break.',
    'CLAUDE.md': 'The binding specification. Code that contradicts it is wrong.',
    '.claude/CLAUDE.md': 'Repo-scoped instructions for AI assistants.',
    '.claude\\CLAUDE.md': 'Repo-scoped instructions for AI assistants.',
    'graphify-out/GRAPH_REPORT.md': 'The generated knowledge-graph report.',
    'graphify-out\\GRAPH_REPORT.md': 'The generated knowledge-graph report.',
}


def lines_of(rel: str) -> list[str]:
    try:
        with open(os.path.join(ROOT, rel), encoding='utf-8', errors='replace') as f:
            return f.read().splitlines()
    except OSError:
        return []


def md_excerpt(rel: str, line_no: int, span: int = 12) -> tuple[str, int]:
    lines = lines_of(rel)
    if not lines:
        return '', 0
    i = min(max(line_no - 1, 0), len(lines) - 1)
    start = i
    while start > 0 and not lines[start].lstrip().startswith('#'):
        start -= 1
    out, blanks = [], 0
    for line in lines[start:start + span]:
        if not line.strip():
            blanks += 1
            if blanks >= 3:
                break
        else:
            blanks = 0
        out.append(line.rstrip())
    return '\n'.join(out).strip(), start + 1


def comment_block_at(rel: str, line_no: int) -> str:
    """The full /** */ or // run containing `line_no`."""
    lines = lines_of(rel)
    if not (0 < line_no <= len(lines)):
        return ''
    i = line_no - 1

    if lines[i].strip().startswith('//'):
        start = i
        while start > 0 and lines[start - 1].strip().startswith('//'):
            start -= 1
        end = i
        while end + 1 < len(lines) and lines[end + 1].strip().startswith('//'):
            end += 1
        return '\n'.join(re.sub(r'^\s*//\s?', '', l) for l in lines[start:end + 1]).strip()

    start = i
    while start > 0 and '/*' not in lines[start]:
        start -= 1
    end = i
    while end < len(lines) and '*/' not in lines[end]:
        end += 1
    body = []
    for line in lines[start:end + 1]:
        c = line.strip()
        c = re.sub(r'^/\*+', '', c)
        c = re.sub(r'\*+/$', '', c)
        c = re.sub(r'^\*\s?', '', c)
        body.append(c.rstrip())
    return '\n'.join(body).strip()


def replace_block(text: str, block: str) -> str:
    wrapped = f'{BEGIN}\n\n{block}\n{END}\n'
    return re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END) + r'\n?',
                  lambda _m: wrapped, text, flags=re.S)


def main() -> None:
    fixed_md = fixed_rationale = 0

    for path in glob.glob(os.path.join(VAULT, '**/*.md'), recursive=True):
        text = open(path, encoding='utf-8', errors='replace').read()
        if BEGIN not in text:
            continue

        fm = re.search(r'---\n(.*?)\n---', text, re.S)
        fmt = fm.group(1) if fm else ''
        srcm = re.search(r'^source_file:\s*"?([^"\n]+)', fmt, re.M)
        if not srcm:
            continue
        rel = srcm.group(1).strip()
        ty = re.search(r'^(?:note_)?type:\s*"?([^"\n]+)', fmt, re.M)
        ty = ty.group(1).strip() if ty else ''
        locm = re.search(r'^location:\s*"?(L\d+)', fmt, re.M)
        line_no = int(locm.group(1)[1:]) if locm else 0
        comm = re.search(r'^community:\s*"?([^"\n]+)', fmt, re.M)
        community = comm.group(1).strip() if comm else ''

        tail = f'*Source: `{rel}`'
        tail += f' · line {line_no}*' if line_no else '*'
        if community:
            tail += f' · *Community: [[_COMMUNITY_{community}]]*'

        parts = None

        if ty == 'rationale':
            comment = comment_block_at(rel, line_no)
            parts = ['## Context', '',
                     'A recorded design rationale — a decision written down in '
                     'the code at the point it applies, so the reasoning '
                     'survives the person who made it.', '']
            if comment:
                parts += ['From `' + rel + '`:', '']
                parts += ['> ' + l if l.strip() else '>'
                          for l in comment.splitlines()]
                parts.append('')
            parts += [tail]
            fixed_rationale += 1

        elif rel.lower().endswith('.md') and rel != 'CLAUDE.md':
            excerpt, heading_line = md_excerpt(rel, line_no or 1)
            role = MD_ROLE.get(rel, f'From the document `{rel}`.')
            parts = ['## Context', '', role, '']
            if excerpt:
                parts += [f'From `{rel}` (line {heading_line}):', '']
                parts += ['> ' + l if l.strip() else '>'
                          for l in excerpt.splitlines()]
                parts.append('')
            parts += [tail]
            fixed_md += 1

        if parts:
            block = '\n'.join(parts).rstrip() + '\n'
            new = replace_block(text, block)
            if new != text:
                open(path, 'w', encoding='utf-8', newline='\n').write(new)

    print(f'  markdown-sourced nodes fixed: {fixed_md}')
    print(f'  rationale nodes fixed:        {fixed_rationale}')


if __name__ == '__main__':
    main()
