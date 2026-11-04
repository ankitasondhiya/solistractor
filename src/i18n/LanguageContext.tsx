import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { copy, type Copy } from './copy'

export type Lang = 'nl' | 'en'

/** A value written once per language. Data files use it for their prose. */
export type Localized<T = string> = Record<Lang, T>

interface LanguageValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Copy
  /** picks the current language out of a Localized value */
  l: <T>(value: Localized<T>) => T
}

const STORAGE_KEY = 'solis-lang'
const LanguageContext = createContext<LanguageValue | null>(null)

function initialLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'nl' || stored === 'en') return stored
  } catch {
    // Storage can be unavailable (private windows, blocked site data); Dutch
    // is the site's own language, so it is the default either way.
  }
  return 'nl'
}

/**
 * Dutch first — this is the Dutch importer's site — with English one click
 * away. A context rather than a router segment: the page is a single scroll
 * and the language is a reading preference, not a different document.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // A preference that cannot be remembered still applies to this visit.
    }
  }, [])

  // The document title is set per page by App (the landing page) and the
  // content pages themselves.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<LanguageValue>(
    () => ({ lang, setLang, t: copy[lang], l: (v) => v[lang] }),
    [lang, setLang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return value
}
