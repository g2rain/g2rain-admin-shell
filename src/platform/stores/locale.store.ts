/**
 * 地域语言（Locale）状态：列表、当前选中、持久化
 * 选项来自 /infra/locale_setting/code_name_map，不再前端写死。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getLocaleCodeNameList, type LocaleCodeName } from '../../runtime/api/locale.api'
import { loadAndApplyI18nMessages, resetI18nLoader } from '../i18n'

export interface LocaleOption {
  code: string
  name: string
}

const STORAGE_KEY = 'g2rain-shell-locale'

function loadSavedLocale(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveLocale(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* ignore quota / private mode */
  }
}

function toLocaleOption(item: LocaleCodeName): LocaleOption {
  return {
    code: item.code,
    name: item.name,
  }
}

function resolveInitialLocale(options: LocaleOption[], saved: string | null): string {
  if (saved && options.some((o) => o.code === saved)) {
    return saved
  }
  return options[0]?.code ?? ''
}

export const useLocaleStore = defineStore('shell-locale', () => {
  const options = ref<LocaleOption[]>([])
  const locale = ref('')
  const initialized = ref(false)
  let initializing: Promise<void> | null = null

  const current = computed<LocaleOption | null>(() => {
    if (!locale.value) {
      return null
    }
    return options.value.find((o) => o.code === locale.value) ?? null
  })

  const label = computed(
    () => current.value?.name ?? locale.value,
  )

  async function syncI18nMessages(force = false): Promise<void> {
    if (!locale.value) {
      return
    }
    await loadAndApplyI18nMessages(locale.value, force)
  }

  function applyLocale(code: string): void {
    if (!code || !options.value.some((o) => o.code === code)) {
      return
    }
    locale.value = code
    saveLocale(code)
  }

  async function initialize(): Promise<void> {
    if (initialized.value) {
      return
    }
    if (initializing) {
      return initializing
    }

    initializing = (async () => {
      try {
        const list = await getLocaleCodeNameList()
        const mapped = list.map(toLocaleOption)
        options.value = mapped

        const code = resolveInitialLocale(mapped, loadSavedLocale())
        if (code) {
          locale.value = code
          saveLocale(code)
        } else {
          locale.value = ''
        }

        initialized.value = true
        await syncI18nMessages(true)
      } finally {
        initializing = null
      }
    })()

    return initializing
  }

  async function setLocale(code: string): Promise<void> {
    if (!initialized.value) {
      console.warn('[LocaleStore] 尚未初始化，忽略切换:', code)
      return
    }
    if (locale.value === code) {
      return
    }
    applyLocale(code)
    await syncI18nMessages(true)
  }

  function reset(): void {
    options.value = []
    locale.value = ''
    initialized.value = false
    initializing = null
    resetI18nLoader()
  }

  return {
    options,
    locale,
    current,
    label,
    initialized,
    initialize,
    setLocale,
    reset,
  }
})
