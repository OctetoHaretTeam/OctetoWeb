"""
Fourth pass: copy the hand-written handbook into the generated vault.

`graphify-out/` is gitignored — it is regenerated output. The handbook is NOT
derivable from source, so it lives in `docs/handbook/` where git keeps it, and
this copies it in after every regeneration.

Notes are namespaced `_CONTEXT_` so they sort with the vault's own context
notes and cannot collide with a graphify node name.
"""

from __future__ import annotations

import glob
import os
import re

ROOT = 'C:/Users/Admin/Documents/GitHub/OctetoWeb'
SRC = os.path.join(ROOT, 'docs/handbook')
VAULT = os.path.join(ROOT, 'graphify-out/obsidian')

FRONTMATTER = (
    '---\n'
    'note_type: "context"\n'
    'tags:\n'
    '  - workspace/context\n'
    '  - workspace/handbook\n'
    '---\n\n'
)

# Superseded by the vault's own _INDEX.
SKIP = {'Home.md'}


def main() -> None:
    if not os.path.isdir(VAULT):
        print(f'  vault not found at {VAULT} — run graphify first')
        return

    names = {
        os.path.splitext(os.path.basename(p))[0]
        for p in glob.glob(os.path.join(SRC, '*.md'))
    }
    ported = 0

    for path in sorted(glob.glob(os.path.join(SRC, '*.md'))):
        name = os.path.basename(path)
        if name in SKIP:
            continue

        text = open(path, encoding='utf-8').read()
        body = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.S).lstrip()

        # Re-point internal wikilinks at the namespaced copies.
        def fix(m: re.Match[str]) -> str:
            target = m.group(1).strip()
            if target in names and target != 'Home':
                return f'[[_CONTEXT_{target}]]'
            return m.group(0)

        body = re.sub(r'\[\[([^\]|#]+)\]\]', fix, body)

        out = os.path.join(VAULT, f'_CONTEXT_{os.path.splitext(name)[0]}.md')
        with open(out, 'w', encoding='utf-8', newline='\n') as f:
            f.write(FRONTMATTER + body)
        ported += 1

    print(f'  handbook notes ported: {ported}')


if __name__ == '__main__':
    main()
