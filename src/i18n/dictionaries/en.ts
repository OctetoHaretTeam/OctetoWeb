import type { Dictionary } from './ro'

/**
 * English UI strings.
 *
 * Typed as `Dictionary`, so a key present in `ro.ts` and missing here fails
 * the build. This is what English is for: judges read it (CLAUDE.md §1).
 */
export const en: Dictionary = {
  site: {
    name: 'OctetoHaret',
    teamNumber: 'FTC #25474',
    tagline: 'A FIRST Tech Challenge team from Chișinău, Moldova',
    skipToContent: 'Skip to content',
  },

  nav: {
    home: 'Home',
    news: 'News',
    performance: 'Performance',
    performanceTech: 'Technical',
    performanceNonTech: 'Non-technical',
    seasons: 'Seasons',
    team: 'Team',
    sponsors: 'Sponsors',
    about: 'About',
    privacy: 'Privacy',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  language: {
    label: 'Language',
    switchTo: 'Switch to English',
    switchToOther: 'Comută pe română',
    current: 'Current language',
  },

  fallback: {
    onlyRomanian: 'This text is only available in Romanian',
  },

  actions: {
    readMore: 'Read more',
    viewAll: 'View all',
    back: 'Back',
    retry: 'Try again',
    contact: 'Get in touch',
    downloadPortfolio: 'Download the portfolio',
    visitWebsite: 'Visit the website',
    save: 'Save',
    publish: 'Publish',
    cancel: 'Cancel',
    delete: 'Delete',
  },

  empty: {
    news: 'No news posted yet. Check back soon.',
    performance: 'Nothing added here yet.',
    seasons: 'The season archive is still being filled in.',
    team: 'The roster is being updated.',
    sponsors: 'We are looking for sponsors this season.',
    awards: 'No awards added yet.',
    search: 'Nothing matches that search.',
  },

  errors: {
    notFoundTitle: 'Page not found',
    notFoundBody:
      'That address does not lead anywhere. It may have been moved.',
    serverTitle: 'Something went wrong',
    serverBody:
      'The page could not be loaded. Reload in a few seconds; if it keeps happening, get in touch.',
    offline: 'You appear to be offline.',
    goHome: 'Go to the home page',
    goToTeam: 'See the team',
  },

  loading: {
    page: 'Loading',
    images: 'Loading images',
  },

  forms: {
    name: 'Name',
    email: 'Email address',
    message: 'Message',
    role: 'Role',
    description: 'Description',
    optional: 'optional',
    required: 'required',
    submit: 'Send',
    sending: 'Sending',
    sent: 'Message sent',
    invalidEmail: 'That email address does not look valid.',
    fieldRequired: 'Please fill in this field.',
    tooLong: 'That text is too long.',
  },

  team: {
    branchTech: 'Technical',
    branchNonTech: 'Non-technical',
    branchMentor: 'Mentor',
    branchVolunteer: 'Volunteer',
    noPhoto: 'Photo unavailable',
    instagram: 'Instagram',
  },

  meta: {
    awards: 'Awards',
    season: 'Season',
    date: 'Date',
    peopleReached: 'People reached',
    schoolsVisited: 'Schools visited',
    fundsRaised: 'Funds raised',
    members: 'Members',
    seasons: 'Seasons',
    scans: 'QR scans',
    countries: 'Countries',
  },
}
