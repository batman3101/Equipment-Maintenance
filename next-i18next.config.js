module.exports = {
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'vi'],
    localeDetection: true,
  },
  fallbackLng: 'ko',
  defaultNS: 'common',
  ns: ['common', 'auth', 'equipment', 'maintenance'],
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  // 베트남어와 한국어의 특수 문자 처리를 위한 설정
  saveMissing: false,
  updateMissing: false,
  // 성능 최적화를 위한 설정
  load: 'languageOnly',
  preload: ['ko', 'vi'],
  cleanCode: true,
  // 디버깅 설정
  debug: process.env.NODE_ENV === 'development',
}