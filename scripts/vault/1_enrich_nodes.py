"""
Give every node in the graphify Obsidian vault a Context section.

Context is DERIVED FROM SOURCE, never invented: the doc comment above the
declaration, the signature itself, the package version, the spec section.
Where a symbol genuinely has no comment, the note falls back to its file's
header comment and says so, rather than inventing a description.

Idempotent — re-running replaces the Context block rather than stacking them.
"""

from __future__ import annotations

import glob
import json
import os
import re
from collections import Counter

ROOT = 'C:/Users/Admin/Documents/GitHub/OctetoWeb'
VAULT = os.path.join(ROOT, 'graphify-out/obsidian')

BEGIN = '<!-- context:begin -->'
END = '<!-- context:end -->'

_src_cache: dict[str, list[str]] = {}


def source_lines(rel: str) -> list[str]:
    if rel not in _src_cache:
        path = os.path.join(ROOT, rel)
        try:
            with open(path, encoding='utf-8', errors='replace') as f:
                _src_cache[rel] = f.read().splitlines()
        except OSError:
            _src_cache[rel] = []
    return _src_cache[rel]


def frontmatter(text: str) -> dict[str, str]:
    m = re.match(r'---\n(.*?)\n---', text, re.S)
    if not m:
        return {}
    out: dict[str, str] = {}
    for line in m.group(1).splitlines():
        km = re.match(r'([a-z_]+):\s*"?([^"]*)"?\s*$', line)
        if km:
            out[km.group(1)] = km.group(2).strip()
    return out


# ── extraction ───────────────────────────────────────────────────────────────

def doc_comment_above(lines: list[str], idx: int) -> str:
    """The JSDoc block or // run immediately above line index `idx`."""
    i = idx - 1
    while i >= 0 and not lines[i].strip():
        i -= 1
    if i < 0:
        return ''

    stripped = lines[i].strip()

    if stripped.endswith('*/'):
        end = i
        while i >= 0 and '/*' not in lines[i]:
            i -= 1
        if i < 0:
            return ''
        body = []
        for line in lines[i:end + 1]:
            c = line.strip()
            c = re.sub(r'^/\*+', '', c)
            c = re.sub(r'\*+/$', '', c)
            c = re.sub(r'^\*\s?', '', c)
            body.append(c.rstrip())
        return '\n'.join(body).strip()

    if stripped.startswith('//'):
        run = []
        while i >= 0 and lines[i].strip().startswith('//'):
            run.append(re.sub(r'^//\s?', '', lines[i].strip()))
            i -= 1
        return '\n'.join(reversed(run)).strip()

    return ''


CONTINUES = ('=', '(', '[', '{', ',', '|', '&', '=>', ':', '?', '<')


def signature(lines: list[str], idx: int, max_lines: int = 14) -> str:
    """The declaration at `idx`, continued until it reads as complete."""
    out: list[str] = []
    depth = 0

    for n, line in enumerate(lines[idx:idx + max_lines]):
        out.append(line.rstrip())
        # Parens and brackets only. Counting braces too made `): Promise<T> {`
        # net out to zero, so the scan never stopped and swallowed the body.
        depth += line.count('(') - line.count(')')
        depth += line.count('[') - line.count(']')
        cur = line.rstrip()
        nxt = lines[idx + n + 1].strip() if idx + n + 1 < len(lines) else ''

        # A chained builder (`z` then `.string()`) or an unfinished line keeps
        # going — otherwise `const x = z` was the whole "signature".
        if nxt.startswith('.') or cur.endswith(CONTINUES):
            continue
        if depth <= 0:
            break

    text = '\n'.join(out).rstrip()
    return re.sub(r'\s*\{\s*$', '', text)


def file_doc(rel: str) -> str:
    """The file's own header doc comment, if it opens with one."""
    lines = source_lines(rel)
    for i, line in enumerate(lines[:60]):
        if line.strip().startswith('/**'):
            end = i
            while end < len(lines) and '*/' not in lines[end]:
                end += 1
            return doc_comment_above(lines, end + 1)
    return ''


def summary_from_doc(doc: str) -> str:
    if not doc:
        return ''
    body = '\n'.join(
        l for l in doc.splitlines() if not l.strip().startswith('@')
    ).strip()
    if not body:
        return ''
    flat = re.sub(r'\s+', ' ', body)
    m = re.match(r'(.+?[.!?])(\s|$)', flat)
    first = (m.group(1) if m else flat).strip()
    return first if len(first) <= 400 else first[:397] + '…'


def rest_of_doc(doc: str, summary: str) -> str:
    if not doc:
        return ''
    body = '\n'.join(
        l for l in doc.splitlines() if not l.strip().startswith('@')
    ).strip()
    flat = re.sub(r'\s+', ' ', body)
    stripped = re.sub(r'\s+', ' ', summary)
    if flat.startswith(stripped):
        if body.startswith(summary):
            return body[len(summary):].strip()
        return flat[len(stripped):].strip()
    return body


# ── reference data ───────────────────────────────────────────────────────────

with open(os.path.join(ROOT, 'package.json'), encoding='utf-8') as _f:
    PKG = json.load(_f)

DEP_ROLE = {
    'react': 'UI library.',
    'react-dom': 'React DOM renderer.',
    '@tanstack/react-router': 'Routing — file-based, the framework the site is built on (§3).',
    '@tanstack/react-start': 'Full-stack layer: server functions, server routes, SSR (§3).',
    'drizzle-orm': 'ORM. Server-only — must never reach the client bundle (§3).',
    'drizzle-kit': 'Migration generation. Migrations are committed (§3).',
    'drizzle-zod': 'Derives Zod schemas from Drizzle tables. Server-side only — '
                   'importing it from a form ships Drizzle to the browser.',
    '@neondatabase/serverless': 'Neon Postgres driver — the production database (§3).',
    '@electric-sql/pglite': 'In-process Postgres for local development only. '
                            'Refused in production.',
    '@vercel/blob': 'File storage. Postgres stores no files (§3).',
    'zod': 'Validation. The server schema is the source of truth (§10).',
    'tailwindcss': 'Styling, CSS-first @theme. No v3 config file (§3).',
    'lucide-react': 'Icons (§3). Brand icons were dropped upstream in v1.',
    'markdown-it': 'Renders body fields. Server-only, with raw HTML disabled — '
                   'that is what makes dangerouslySetInnerHTML safe.',
    'vite': 'Build tool and dev server.',
    'typescript': 'Type checking, strict: true (§13).',
}

SCRIPT_ROLE = {
    'dev': 'The dev server. Note that PGlite allows a single writer — stop it '
           'before running any db: script.',
    'build': 'Production build. Also where import protection fails the build if '
             'server-only code reaches the client bundle.',
    'typecheck': 'tsc --noEmit. strict: true, and no `any` (§13).',
    'test': 'The Bun test suite.',
    'generate-routes': 'Regenerates routeTree.gen.ts. Run after adding or '
                       'renaming a route file.',
    'db:generate': 'Generates a migration from the schema. Works without a '
                   'database, so it can run in CI.',
    'db:migrate': 'Applies committed migrations to Neon.',
    'db:push': 'Pushes the schema without a migration. Prefer db:generate.',
    'db:studio': 'Drizzle Studio against whichever database is configured.',
    'db:seed': 'Placeholder content only — it invents no names, sponsors or '
               'statistics (§13). Safe to re-run.',
    'db:local': 'Builds the local PGlite database from the committed '
                'migrations. Development only.',
    'db:backup': 'JSON dump written OUTSIDE the data directory, so a corrupted '
                 'database cannot take the backup with it. Dumps are gitignored '
                 '— they contain member names and consent flags.',
    'db:restore': 'Restores a dump into a freshly built database.',
    'db:reset': 'Rebuilds the local database from migrations and seed.',
}


def dep_context(name: str) -> tuple[str, str]:
    deps, dev = PKG.get('dependencies', {}), PKG.get('devDependencies', {})
    if name in deps:
        return deps[name], 'dependency'
    if name in dev:
        return dev[name], 'devDependency'
    return '', ''


def lang_for(rel: str) -> str:
    return {'.ts': 'ts', '.tsx': 'tsx', '.sql': 'sql', '.json': 'json'}.get(
        os.path.splitext(rel)[1], ''
    )


def provenance(rel: str, line_no: int, community: str) -> str:
    where = f'`{rel}`' + (f' · line {line_no}' if line_no else '')
    tail = f'*Source: {where}*'
    if community:
        tail += f' · *Community: [[_COMMUNITY_{community}]]*'
    return tail


def describe_undocumented_file(rel: str) -> str:
    """A truthful description for files that carry no doc comment."""
    base = os.path.basename(rel)
    if '/components/ui/' in rel.replace('\\', '/'):
        return (f'`{base}` is a shadcn/ui primitive, generated by the shadcn '
                f'CLI rather than hand-written. Its appearance comes from the '
                f'semantic tokens in `theme.css`, which are mapped onto the '
                f'branch tokens — so it adapts to the tech and non-tech '
                f'treatments without a variant prop.')
    if rel.endswith('.test.ts') or rel.endswith('.test.tsx'):
        return (f'`{base}` is a test file. Tests are not bundled, so they may '
                f'import server-only modules that application code cannot.')
    return f'`{base}` — no file-level doc comment.'


# ── context builders ─────────────────────────────────────────────────────────

def build_context(title: str, fm: dict) -> str:
    rel = fm.get('source_file', '')
    loc = fm.get('location', '')
    community = fm.get('community', '')
    ext = os.path.splitext(rel)[1]
    line_no = int(loc[1:]) if re.fullmatch(r'L\d+', loc or '') else 0

    parts: list[str] = ['## Context', '']

    if ext in ('.ts', '.tsx'):
        lines = source_lines(rel)
        idx = line_no - 1 if 0 < line_no <= len(lines) else -1
        doc = doc_comment_above(lines, idx) if idx >= 0 else ''
        summ = summary_from_doc(doc)
        sig = signature(lines, idx) if idx >= 0 else ''

        from_file = False
        if not summ:
            fdoc = file_doc(rel)
            fsumm = summary_from_doc(fdoc)
            if fsumm:
                doc, summ, from_file = fdoc, fsumm, True

        if summ and from_file:
            parts += [
                f'*No comment on this declaration itself — the following '
                f'describes its file, `{os.path.basename(rel)}`.*', '', summ, '',
            ]
        elif summ:
            parts += [summ, '']
        else:
            parts += [describe_undocumented_file(rel), '']

        if sig:
            parts += ['```' + lang_for(rel), sig, '```', '']

        extra = rest_of_doc(doc, summ)
        if extra and len(extra) > 40:
            parts.append('> [!note] Why it is written this way')
            for line in extra.splitlines():
                parts.append('> ' + line if line.strip() else '>')
            parts.append('')

    elif ext == '.json' and rel.endswith('package.json'):
        script = PKG.get('scripts', {}).get(title)
        if script:
            parts += [f'A package script — `bun run {title}` runs:', '',
                      '```bash', script, '```', '']
            role = SCRIPT_ROLE.get(title)
            if role:
                parts += [role, '']
        else:
            version, kind = dep_context(title)
            role = DEP_ROLE.get(title, '')
            if version:
                parts += [f'**{kind}** — `{title}@{version}`.'
                          + (f' {role}' if role else ''), '']
            else:
                parts += ['Declared in `package.json`.'
                          + (f' {role}' if role else ''), '']
            parts += ['The stack is fixed by `CLAUDE.md` §3 — Bun, never '
                      'npm/yarn/pnpm, and `bun.lock` is committed.', '']

    elif ext == '.md':
        parts += [f'Defined in `{rel}`.', '']

    elif ext == '.sql':
        lines = source_lines(rel)
        idx = line_no - 1 if 0 < line_no <= len(lines) else -1
        snippet = '\n'.join(lines[idx:idx + 6]).strip() if idx >= 0 else ''
        parts += [f'Part of the committed migration `{os.path.basename(rel)}`. '
                  'Migrations are committed and applied with drizzle-kit (§3).', '']
        if snippet:
            parts += ['```sql', snippet, '```', '']

    elif ext == '.webp':
        parts += [f'Image asset at `{rel}`. Uploaded images are re-encoded in '
                  'the browser before upload, which strips EXIF including GPS '
                  '(§8).', '']

    else:
        parts += [f'Defined in `{rel}`.', '']

    parts += [provenance(rel, line_no, community), '']
    return '\n'.join(parts).rstrip() + '\n'


def _first_decl(rel: str) -> int:
    lines = source_lines(rel)
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith(('export ', 'const ', 'function ', 'class ', 'type ')):
            return i
    return min(1, len(lines))


def build_source_context(rel: str) -> str:
    lines = source_lines(rel)
    doc = file_doc(rel) or doc_comment_above(lines, _first_decl(rel))
    summ = summary_from_doc(doc)

    parts = ['## Context', '']
    if summ:
        parts += [summ, '']
        extra = rest_of_doc(doc, summ)
        if extra and len(extra) > 40:
            parts.append('> [!note] Why it is written this way')
            for line in extra.splitlines():
                parts.append('> ' + line if line.strip() else '>')
            parts.append('')
    else:
        parts += [describe_undocumented_file(rel), '',
                  f'{len(lines)} lines.', '']
    return '\n'.join(parts).rstrip() + '\n'


def build_community_context(text: str) -> str:
    members = re.findall(r'^- \[\[([^\]]+)\]\] - (\S+) - (\S+)$', text, re.M)
    files = Counter(m[2] for m in members)
    kinds = Counter(m[1] for m in members)
    dirs = Counter(os.path.dirname(f) for f in files)

    parts = ['## Context', '']
    if not members:
        parts += ['This community has no members recorded.', '']
        return '\n'.join(parts).rstrip() + '\n'

    top_dir = dirs.most_common(1)[0][0] if dirs else ''
    parts += [f'A cluster of **{len(members)} nodes** across '
              f'**{len(files)} file(s)**'
              + (f', mostly in `{top_dir}/`' if top_dir else '') + '.', '']

    parts += ['**Files involved:**', '']
    for f, n in files.most_common(8):
        parts.append(f'- `{f}` — {n} node(s)')
    if len(files) > 8:
        parts.append(f'- …and {len(files) - 8} more')
    parts.append('')

    primary = files.most_common(1)[0][0]
    summ = summary_from_doc(file_doc(primary))
    if summ:
        parts += [f'The primary file, `{primary}`, describes itself as:', '',
                  f'> {summ}', '']

    kind_str = ', '.join(f'{v} {k}' for k, v in kinds.most_common())
    parts += [f'*Node kinds: {kind_str}.*', '']
    return '\n'.join(parts).rstrip() + '\n'


# ── apply ────────────────────────────────────────────────────────────────────

def insert(text: str, block: str) -> str:
    wrapped = f'{BEGIN}\n\n{block}\n{END}\n'
    if BEGIN in text and END in text:
        # A lambda, not the string: extracted code contains regex literals like
        # /^\/q\/?/, and re.sub reads backslashes in a replacement string as
        # group references.
        return re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END) + r'\n?',
                      lambda _m: wrapped, text, flags=re.S)
    m = re.search(r'^(# .+?\n)', text, re.M)
    if not m:
        return text.rstrip() + '\n\n' + wrapped
    at = m.end()
    return text[:at] + '\n' + wrapped + text[at:]


def main() -> None:
    counts: Counter[str] = Counter()
    for path in glob.glob(os.path.join(VAULT, '**/*.md'), recursive=True):
        text = open(path, encoding='utf-8', errors='replace').read()
        fm = frontmatter(text)
        tm = re.search(r'^# (.+)$', text, re.M)
        title = tm.group(1).strip() if tm else ''
        ntype = fm.get('type') or fm.get('note_type') or ''

        if ntype == 'community':
            block = build_community_context(text)
        elif ntype == 'source':
            block = build_source_context(fm.get('source_file', ''))
        elif fm.get('source_file'):
            block = build_context(title, fm)
        else:
            counts['skipped (is itself a context doc)'] += 1
            continue

        new = insert(text, block)
        if new != text:
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(new)
            counts[f'enriched:{ntype or "?"}'] += 1
        else:
            counts['unchanged'] += 1

    for k, v in sorted(counts.items()):
        print(f'  {v:5}  {k}')


if __name__ == '__main__':
    main()
