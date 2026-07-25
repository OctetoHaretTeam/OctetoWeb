import { useEffect, useRef, useState } from 'react'

/**
 * localStorage draft autosave — CLAUDE.md §9 and §10.
 *
 * The session is an 8-hour sliding window, but a browser can still be closed,
 * a laptop can still sleep, and a tab can still be lost. Every admin editor
 * keeps a local draft so none of those destroys a half-written post.
 *
 * The draft is deliberately kept in localStorage rather than on the server: it
 * is unvalidated work in progress, and it should not become a row anyone else
 * can see before the author chooses to save.
 */

const PREFIX = 'octeto:draft:'
/** Drafts older than this are ignored — stale work is worse than none. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type Stored<T> = { savedAt: number; values: T }

export type DraftState<T> = {
  /** A recovered draft that differs from what was loaded from the database. */
  recovered: Stored<T> | null
  /** Applies the recovered draft and dismisses the prompt. */
  restore: () => void
  /** Throws the draft away and dismisses the prompt. */
  discard: () => void
  /** Call after a successful save, so the draft stops shadowing saved data. */
  clear: () => void
}

export function useDraftAutosave<T>({
  key,
  values,
  enabled = true,
  onRestore,
}: {
  /** Stable per record — e.g. `team:andrei`, or `team:new`. */
  key: string
  values: T
  enabled?: boolean
  onRestore: (values: T) => void
}): DraftState<T> {
  const storageKey = `${PREFIX}${key}`
  const [recovered, setRecovered] = useState<Stored<T> | null>(null)
  // The values as loaded, so an echo of them is not mistaken for a draft.
  const baseline = useRef(JSON.stringify(values))

  // Look for a draft once per record, on mount.
  useEffect(() => {
    if (!enabled) return

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return

      const parsed = JSON.parse(raw) as Stored<T>
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
        window.localStorage.removeItem(storageKey)
        return
      }

      // Nothing to offer if the draft matches what was loaded anyway.
      if (JSON.stringify(parsed.values) === baseline.current) return

      setRecovered(parsed)
    } catch {
      // A malformed draft is not worth surfacing — drop it and move on.
      window.localStorage.removeItem(storageKey)
    }
  }, [storageKey, enabled])

  // Persist on change, debounced so typing does not thrash localStorage.
  useEffect(() => {
    if (!enabled) return

    const serialised = JSON.stringify(values)
    if (serialised === baseline.current) return

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ savedAt: Date.now(), values } satisfies Stored<T>),
        )
      } catch {
        // Quota exceeded or storage disabled. Losing autosave is acceptable;
        // breaking the editor is not.
      }
    }, 500)

    return () => window.clearTimeout(timer)
  }, [storageKey, values, enabled])

  const clear = () => {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Nothing useful to do.
    }
    setRecovered(null)
  }

  return {
    recovered,
    restore: () => {
      if (recovered) onRestore(recovered.values)
      setRecovered(null)
    },
    discard: clear,
    clear,
  }
}
