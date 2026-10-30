/**
 * Platform module public exports.
 * RuntimeAdapter, stores, types and Main/Theme coordinators.
 */

export { initMainPlatform, getMainPlatform } from './main-platform'
export { initThemeController, getThemeController } from './theme'
export { useWorkspaceStore, OVERVIEW_VIEW_ID, OVERVIEW_TAB_ID } from './stores/workspace.store'
export {
  useRuntimeStore,
  getSharedRuntimeLoader,
  setAdapterResolver,
} from './stores/runtime.store'
export type { AdapterResolver, ShellMicroAppAdapter } from './apps/adapters'
export { useSessionStore } from './stores/session.store'
export { useLocaleStore } from './stores/locale.store'
export type { LocaleOption } from './stores/locale.store'
export { useThemeStore } from './stores/theme.store'
export type { SessionUserSummary, SessionOrganSummary } from './stores/session.store'
export type {
  MicroAppDefinition,
  WorkspaceView,
  WorkspaceViewKind,
  WorkspaceTab,
  RuntimeInstance,
  RuntimeInstanceStatus,
} from './types/workspace'
export type { RuntimeAdapter } from './types/runtime-adapter'
