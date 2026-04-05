import { createI18n } from 'vue-i18n'
import { Locale } from 'vant'

import enUS from 'vant/lib/locale/lang/en-US'
import zhCN from 'vant/lib/locale/lang/zh-CN'
import twCN from 'vant/lib/locale/lang/zh-TW'
import koCN from 'vant/lib/locale/lang/ko-KR'
import jaCN from 'vant/lib/locale/lang/ja-JP'
import idCN from 'vant/lib/locale/lang/id-ID'
import viCN from 'vant/lib/locale/lang/vi-VN'
import thCN from 'vant/lib/locale/lang/th-TH'
import en from './modules/en.json'
import zh from './modules/zh.json'
import tw from './modules/tw.json'
import kr from './modules/kr.json'
import ja from './modules/ja.json'
import id from './modules/id.json'
import vi from './modules/vi.json'
import th from './modules/th.json'

const messages = {
  en: {
    ...enUS,
    ...en
  },
  tw: {
    ...twCN,
    ...tw
  },
  zh: {
    ...zhCN,
    ...zh
  },
  kr: {
    ...koCN,
    ...kr
  },
  ja: {
    ...jaCN,
    ...ja
  },
  id: {
    ...idCN,
    ...id
  },
  vi: {
    ...viCN,
    ...vi
  },
  th: {
    ...thCN,
    ...th
  }
}

export const i18n = new createI18n({
  // 创建i18n实例
  globalInjection: true,
  locale: localStorage.lang || 'zh',
  legacy: false,
  messages: messages
})

export const setLocales = (lang) => {
  if (lang === 'en') {
    Locale.use(lang, enUS)
  } else if (lang === 'zh') {
    Locale.use('zh', zhCN)
  } else if (lang === 'tw') {
    Locale.use('tw', twCN)
  } else if (lang === 'kr') {
    Locale.use('kr', koCN)
  } else if (lang === 'ja') {
    Locale.use('ja', jaCN)
  } else if (lang === 'id') {
    Locale.use('id', idCN)
  } else if (lang === 'vi') {
    Locale.use('vi', viCN)
  } else if (lang === 'th') {
    Locale.use('th', thCN)
  }
  localStorage.setItem('lang', lang)
}
