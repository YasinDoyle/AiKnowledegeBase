import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import allLang from '@/bt-i18n/all'
import storage from '@/utils/storage'

const resources = Object.fromEntries(
  Object.entries(allLang).map(([lang, translations]) => [lang, { translation: translations }]),
)

i18n.use(initReactI18next).init({
  resources,
  lng: storage.language || 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
})

export function setLang(lang: string) {
  i18n.changeLanguage(lang)
  storage.language = lang
}

export default i18n
