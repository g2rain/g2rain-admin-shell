/**
 * 主题状态管理 — 包装 @g2rain/platform/theme ThemeController
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ThemeMode, ThemeConfig } from '../theme/types'
import { THEME_MODES } from '../theme/types'
import { getThemeController, initThemeController } from '../theme'

export const useThemeStore = defineStore('theme', () => {
  const currentMode = ref<ThemeMode>('light')
  const initialized = ref(false)

  const currentTheme = computed<ThemeConfig>(() => THEME_MODES[currentMode.value])

  const availableThemes = computed<ThemeConfig[]>(() => Object.values(THEME_MODES))

  const initialize = async (_defaultTheme: ThemeMode = 'light'): Promise<void> => {
    if (initialized.value) {
      return
    }

    const ctrl = initThemeController()
    currentMode.value = ctrl.getTheme()
    initialized.value = true
  }

  const setTheme = async (mode: ThemeMode): Promise<void> => {
    if (currentMode.value === mode) {
      return
    }
    const ctrl = getThemeController()
    ctrl.setTheme(mode)
    currentMode.value = mode
  }

  const reset = (): void => {
    currentMode.value = 'light'
    initialized.value = false
  }

  return {
    currentMode,
    currentTheme,
    availableThemes,
    initialized,
    initialize,
    setTheme,
    reset,
  }
})
