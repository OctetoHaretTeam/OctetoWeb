import { z } from 'zod'

import { imageSchema } from '@/lib/schemas'
import { slugSchema } from './primitives'

/**
 * The team member editor's input contract — CLAUDE.md §10.
 *
 * Hand-written pure Zod rather than derived from the Drizzle table, because
 * this schema is imported by the admin form and therefore ships to the
 * browser. Deriving it with drizzle-zod pulled drizzle-orm into the client
 * bundle and doubled public-route JS.
 *
 * The table is still the database truth. `team-member.test.ts` parses a valid
 * form value through the drizzle-derived insert schema, so the two cannot
 * drift apart without a test failing.
 */
export const teamMemberFormSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, 'Numele este obligatoriu.').max(120),
  roleRo: z.string().min(1, 'Rolul în română este obligatoriu.'),
  roleEn: z.string().nullable(),
  branch: z.enum(['tech', 'non_tech', 'mentor', 'volunteer']),
  descriptionRo: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  image: imageSchema.nullable(),
  instagramUrl: z.url('Adresa nu pare validă.').nullable(),
  octetIndex: z
    .int('Introdu un număr întreg.')
    .min(0, 'Minim 0.')
    .max(255, 'Maxim 255.'),
  isActive: z.boolean(),
  displayOrder: z.int(),
  /** Both default to false at the column level — §8. */
  photoConsent: z.boolean(),
  fullNamePublic: z.boolean(),
})

export type TeamMemberFormInput = z.infer<typeof teamMemberFormSchema>

export const MEMBER_BRANCHES = [
  'tech',
  'non_tech',
  'mentor',
  'volunteer',
] as const
