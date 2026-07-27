"""
Second pass: the two categories the first pass left thin.

- CLAUDE.md concept nodes have no `location`, so the spec extractor never ran.
  There are only 14, so they are mapped to their section explicitly rather
  than fuzzy-matched.
- JSON config keys got nothing at all. They now show the key, its value, and
  what the file it lives in is for.
"""

from __future__ import annotations

import json
import os
import re
import glob

ROOT = 'C:/Users/Admin/Documents/GitHub/OctetoWeb'
VAULT = os.path.join(ROOT, 'graphify-out/obsidian')
BEGIN, END = '<!-- context:begin -->', '<!-- context:end -->'

# Concept title -> (CLAUDE.md heading line, section label)
SPEC_MAP = {
    'Admin Authentication': (382, '§9 Auth'),
    'Bilingual (ROEN) System': (421, '§11 Language system (RO / EN)'),
    'CLAUDE': (1, 'the whole specification'),
    'Drizzle Database Schema': (135, '§5 Database schema'),
    'OctetoHaret (FTC 25474)': (9, '§1 The team'),
    'OctetoHaret Team': (9, '§1 The team'),
    'OctetoHaret Team_1': (9, '§1 The team'),
    'PaperCutout Component': (319, '§7.4 Signature: PaperCutout'),
    'Performance Budget': (476, '§12 Performance budget'),
    'QR Redirect System': (209, '§6 QR system'),
    'Tech Stack': (50, '§3 Stack (strict)'),
    'Technical vs Non-Technical Split': (306, '§7.3 The branch split'),
    'Visual Identity & Palette': (269, '§7.2 Palette'),
}

CONFIG_ROLE = {
    'components.json': 'shadcn/ui configuration — where components are '
                       'generated and which tokens they use.',
    'tsconfig.json': 'TypeScript compiler configuration. `strict: true` is '
                     'required by §13.',
    'tsr.config.json': 'TanStack Router route-generation config.',
    'package.json': 'Package manifest. Bun only — never npm/yarn/pnpm (§3).',
    'drizzle.config.ts': 'Drizzle Kit configuration for migrations.',
    '.claude/settings.json': 'Claude Code harness settings for this repo.',
}


def spec_excerpt(line_no: int, span: int = 16) -> str:
    lines = open(os.path.join(ROOT, 'CLAUDE.md'), encoding='utf-8').read().splitlines()
    start = max(0, line_no - 1)
    out, blanks = [], 0
    for line in lines[start:start + span]:
        if not line.strip():
            blanks += 1
            if blanks >= 3:
                break
        else:
            blanks = 0
        out.append(line.rstrip())
    return '\n'.join(out).strip()


def json_key_context(rel: str, line_no: int, title: str) -> str:
    path = os.path.join(ROOT, rel)
    try:
        lines = open(path, encoding='utf-8').read().splitlines()
    except OSError:
        return ''
    if not (0 < line_no <= len(lines)):
        return ''

    raw = lines[line_no - 1].strip().rstrip(',')
    # If the value opens an object/array, include a few following lines.
    snippet = [raw]
    if raw.endswith('{') or raw.endswith('['):
        depth = raw.count('{') + raw.count('[') - raw.count('}') - raw.count(']')
        for line in lines[line_no:line_no + 10]:
            snippet.append(line.rstrip())
            depth += (line.count('{') + line.count('[')
                      - line.count('}') - line.count(']'))
            if depth <= 0:
                break
    return '\n'.join(snippet)


def replace_block(text: str, block: str) -> str:
    wrapped = f'{BEGIN}\n\n{block}\n{END}\n'
    return re.sub(
        re.escape(BEGIN) + r'.*?' + re.escape(END) + r'\n?',
        wrapped, text, flags=re.S,
    )


def main() -> None:
    fixed_spec = fixed_json = 0

    for path in glob.glob(os.path.join(VAULT, '**/*.md'), recursive=True):
        text = open(path, encoding='utf-8', errors='replace').read()
        if BEGIN not in text:
            continue

        title = os.path.splitext(os.path.basename(path))[0]
        fm = re.search(r'---\n(.*?)\n---', text, re.S)
        fmt = fm.group(1) if fm else ''
        srcm = re.search(r'^source_file:\s*"?([^"\n]+)', fmt, re.M)
        if not srcm:
            continue
        rel = srcm.group(1).strip()
        locm = re.search(r'^location:\s*"?(L\d+)', fmt, re.M)
        line_no = int(locm.group(1)[1:]) if locm else 0
        comm = re.search(r'^community:\s*"?([^"\n]+)', fmt, re.M)
        community = comm.group(1).strip() if comm else ''

        parts = None

        # ── CLAUDE.md concepts ───────────────────────────────────────────
        if rel == 'CLAUDE.md' and title in SPEC_MAP:
            heading_line, label = SPEC_MAP[title]
            excerpt = spec_excerpt(heading_line)
            parts = [
                '## Context', '',
                f'A concept drawn from the project specification, '
                f'**`CLAUDE.md` {label}**. The spec is the contract the whole '
                f'site answers to — where the code disagrees with it, the '
                f'disagreement is deliberate and recorded.',
                '',
                f'From `CLAUDE.md` (line {heading_line}):',
                '',
            ]
            parts += ['> ' + l if l.strip() else '>' for l in excerpt.splitlines()]
            parts += ['', f'*Source: `CLAUDE.md` · line {heading_line}*'
                      + (f' · *Community: [[_COMMUNITY_{community}]]*' if community else '')]
            fixed_spec += 1

        # ── JSON config keys ─────────────────────────────────────────────
        elif rel.endswith('.json') and not rel.endswith('package.json') and line_no:
            snippet = json_key_context(rel, line_no, title)
            role = CONFIG_ROLE.get(rel, f'Configuration file `{rel}`.')
            parts = [
                '## Context', '',
                f'A configuration key in `{rel}` — {role}',
                '',
            ]
            if snippet:
                parts += ['```json', snippet, '```', '']
            parts += [f'*Source: `{rel}` · line {line_no}*'
                      + (f' · *Community: [[_COMMUNITY_{community}]]*' if community else '')]
            fixed_json += 1

        if parts:
            block = '\n'.join(parts).rstrip() + '\n'
            new = replace_block(text, block)
            if new != text:
                with open(path, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(new)

    print(f'  spec concepts fixed: {fixed_spec}')
    print(f'  json config keys fixed: {fixed_json}')


if __name__ == '__main__':
    main()
