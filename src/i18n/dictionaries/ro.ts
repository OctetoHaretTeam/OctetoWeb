/**
 * Romanian UI strings — the reference dictionary (CLAUDE.md §11).
 *
 * `Dictionary` is derived from this object, and `en.ts` is typed as
 * `Dictionary`. A key added here and forgotten in English is a TypeScript
 * error, not a blank button at a competition.
 *
 * These are interface strings only. Content (news, profiles, entries) is
 * bilingual at the database level and never passes through here.
 */
export const ro = {
  site: {
    name: 'OctetoHaret',
    teamNumber: 'FTC #25474',
    tagline: 'Echipă FIRST Tech Challenge din Chișinău',
    skipToContent: 'Sari la conținut',
    copyright: 'Toate drepturile rezervate',
  },

  nav: {
    home: 'Acasă',
    news: 'Noutăți',
    performance: 'Realizări',
    performanceTech: 'Tehnic',
    performanceNonTech: 'Non-tehnic',
    seasons: 'Sezoane',
    team: 'Echipa',
    sponsors: 'Sponsori',
    about: 'Despre',
    privacy: 'Confidențialitate',
    openMenu: 'Deschide meniul',
    closeMenu: 'Închide meniul',
  },

  language: {
    /** Labelling the control itself, for screen readers. */
    label: 'Limbă',
    switchTo: 'Comută pe română',
    switchToOther: 'Switch to English',
    current: 'Limba curentă',
  },

  /**
   * The quiet note rendered when an English field is missing and the Romanian
   * text is shown instead (§11). Never hide the switcher on such a page.
   */
  fallback: {
    onlyRomanian: 'Acest text este disponibil doar în română',
  },

  actions: {
    readMore: 'Citește mai mult',
    viewAll: 'Vezi toate',
    back: 'Înapoi',
    retry: 'Încearcă din nou',
    contact: 'Scrie-ne',
    downloadPortfolio: 'Descarcă portofoliul',
    visitWebsite: 'Vizitează site-ul',
    save: 'Salvează',
    publish: 'Publică',
    cancel: 'Renunță',
    delete: 'Șterge',
  },

  empty: {
    news: 'Încă nu am publicat noutăți. Revino în curând.',
    performance: 'Încă nu am adăugat realizări aici.',
    seasons: 'Arhiva sezoanelor se completează.',
    team: 'Lista echipei se actualizează.',
    sponsors: 'Căutăm sponsori pentru sezonul acesta.',
    awards: 'Încă nu am adăugat premii.',
    search: 'Nimic nu se potrivește cu căutarea.',
  },

  errors: {
    notFoundTitle: 'Pagina nu există',
    notFoundBody:
      'Adresa pe care ai deschis-o nu duce nicăieri. Poate a fost mutată.',
    serverTitle: 'Ceva nu a funcționat',
    serverBody:
      'Nu am putut încărca pagina. Reîncarcă peste câteva secunde; dacă se repetă, scrie-ne.',
    offline: 'Pare că nu ai conexiune la internet.',
    goHome: 'Mergi la pagina principală',
    goToTeam: 'Vezi echipa',
  },

  loading: {
    page: 'Se încarcă',
    images: 'Se încarcă imaginile',
  },

  forms: {
    name: 'Nume',
    email: 'Adresă de email',
    message: 'Mesaj',
    role: 'Rol',
    description: 'Descriere',
    optional: 'opțional',
    required: 'obligatoriu',
    submit: 'Trimite',
    sending: 'Se trimite',
    sent: 'Mesajul a fost trimis',
    invalidEmail: 'Adresa de email nu pare validă.',
    fieldRequired: 'Completează acest câmp.',
    tooLong: 'Textul este prea lung.',
  },

  team: {
    /** Branch names as they appear to the public. */
    branchTech: 'Tehnic',
    branchNonTech: 'Non-tehnic',
    branchMentor: 'Mentor',
    branchVolunteer: 'Voluntar',
    /** Shown in place of a photograph when consent is absent (§8). */
    noPhoto: 'Fotografie indisponibilă',
    instagram: 'Instagram',
  },

  meta: {
    awards: 'Premii',
    season: 'Sezon',
    date: 'Data',
    peopleReached: 'Persoane implicate',
    schoolsVisited: 'Școli vizitate',
    fundsRaised: 'Fonduri atrase',
    members: 'Membri',
    seasons: 'Sezoane',
    scans: 'Scanări QR',
    countries: 'Țări',
  },

  hero: {
    goToSlide: 'Mergi la diapozitivul',
  },

  sponsorship: {
    title: 'Devino sponsor',
    body: 'Suntem mereu bucuroși să primim sponsori noi. Fiecare sprijin ne duce mai departe — piese, deplasări, ateliere. Scrie-ne și îți trimitem pachetul de sponsorizare.',
    cta: 'Scrie-ne',
  },

  contact: {
    title: 'Scrie-ne',
    lead: 'Sponsori, echipe sau presă — răspundem la fiecare mesaj.',
    email: 'Email',
    phone: 'Telefon',
    address: 'Adresă',
    follow: 'Urmărește-ne',
  },
}

/**
 * The shape every locale must satisfy.
 *
 * Deliberately NOT `as const`: literal types would force English to repeat the
 * Romanian strings verbatim. Widening to `string` keeps the key structure as
 * the contract, which is the part that matters.
 */
export type Dictionary = typeof ro
