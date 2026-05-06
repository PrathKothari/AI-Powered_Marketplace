import { useState, useEffect } from 'react'

export const translations: Record<string, Record<string, string>> = {
  en: {
    explore: "Explore Products",
    sell: "Start Selling",
    cart: "Cart",
    marketplace: "Marketplace"
  },
  hi: {
    explore: "उत्पाद देखें",
    sell: "बेचना शुरू करें",
    cart: "कार्ट",
    marketplace: "मार्केटप्लेस"
  }
}

export function useTranslation() {
  const [lang, setLangState] = useState("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('app-lang')
    if (saved && translations[saved]) {
      setLangState(saved)
    }
  }, [])

  const setLang = (newLang: string) => {
    setLangState(newLang)
    localStorage.setItem('app-lang', newLang)
  }

  // Fallback to "en" keys if not mounted to prevent hydration differences, or just use the chosen language.
  const activeLang = mounted ? lang : "en"
  const t = (key: string) => (translations[activeLang] && translations[activeLang][key]) || key

  return { t, lang: activeLang, setLang }
}
