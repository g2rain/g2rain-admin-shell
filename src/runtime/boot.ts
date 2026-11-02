import { createApp, type App } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { G2rainUi } from '@g2rain/ui'
import type { MainPublicProps } from '@g2rain/platform/main'
import AppRoot from '../App.vue'
import {
  emitDirectedMessage,
  openAuthBridge,
  startRequestTokenHandler,
  startRouteChangeHandler,
  startTokenInvalidHandler,
} from '../components/micro-app'
import { initMainPlatform } from '../platform/main-platform'
import { initThemeController } from '../platform/theme'
import { i18n, t } from '../platform/i18n'
import { useLocaleStore } from '../platform/stores/locale.store'
import { useThemeStore } from '../platform/stores/theme.store'
import { useRuntimeStore } from '../platform/stores/runtime.store'
import { useSessionStore } from '../platform/stores/session.store'
import { useAccessTokenStore } from '../platform/stores/token.store'
import { awaitRuntimeEnvConfig } from '../shared/env'
import { createShellRouter } from './router'
import { initHttpClient } from './http'
import { silenceNotified } from './http/notified'
import { sso } from './auth/sso'
import { startMenuBoot, setMenuBootRouter } from './boot/menu.boot'
import { ensureQiankunStarted } from '../platform/apps/qiankun-adapter'
import { rewriteMicroDeepLinkToGateway } from './navigation/sub-app-redirect'
import { installShellExtensions } from './shell-extensions'

/**
 * Target boot order (contract):
 * Vue App → Store / i18n / UI → Theme → HTTP → Session/SSO → MicroApp → Tab → mount
 */
export async function boot(): Promise<App> {
  // Wait for env-config.js (runtime SSO) before any SSO redirect
  await awaitRuntimeEnvConfig()

  // Must run before Vue Router: outside-base micro URLs would be rewritten to
  // /{context}/member/... by createHref on the first navigation.
  rewriteMicroDeepLinkToGateway()

  const app = createApp(AppRoot)
  silenceNotified(app)
  const pinia = createPinia()
  app.use(pinia)

  const localeStore = useLocaleStore()
  app.use(i18n)
  app.use(ElementPlus)
  app.use(G2rainUi, {
    translate: (key, fallback) => t(key, fallback),
    locale: () => localeStore.locale,
  })

  initThemeController()
  await useThemeStore().initialize()
  initHttpClient()

  const runtimeStore = useRuntimeStore()
  initMainPlatform({
    async updateInstanceProps(instanceId, props: Readonly<MainPublicProps>) {
      await runtimeStore.updateInstanceProps(instanceId, props)
    },
    emit(message) {
      emitDirectedMessage(message)
    },
  })

  // Extension hook (default no-op; AppKit-only).
  installShellExtensions()

  startTokenInvalidHandler()
  startRequestTokenHandler()
  startRouteChangeHandler()
  openAuthBridge()
  ensureQiankunStarted()

  const router = createShellRouter()
  setMenuBootRouter(router)
  app.use(router)

  sso.start()
  await useSessionStore().bootstrapSession()
  if (useAccessTokenStore().isLogin) {
    try {
      await useLocaleStore().initialize()
    } catch (error) {
      console.error('[boot] 语言列表初始化失败:', error)
    }
  }
  startMenuBoot()
  await router.isReady()
  app.mount('#app')
  return app
}
