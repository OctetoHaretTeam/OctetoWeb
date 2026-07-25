import type { Locale } from '../locale'
import { en } from './en'
import { type Dictionary, ro } from './ro'

export type { Dictionary }

export const DICTIONARIES: Record<Locale, Dictionary> = { ro, en }

/** UI strings for a locale. Content never goes through here (CLAUDE.md §11). */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}
