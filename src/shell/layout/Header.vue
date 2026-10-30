<template>
  <header class="shell-header">
    <div class="logo">
      <img :src="logoHeader" :alt="$t('MS_HDR_LOGO', '谷雨开源SaaS平台')" class="logo-image" />
    </div>

    <div class="header-right">
      <el-select
        v-model="selectedLocale"
        :placeholder="$t('MS_HDR_LANG_PH', '选择语言')"
        filterable
        class="locale-select"
        :disabled="!localeStore.initialized || localeStore.options.length === 0"
        :loading="!localeStore.initialized"
      >
        <el-option
          v-for="item in localeStore.options"
          :key="item.code"
          :label="item.name"
          :value="item.code"
        />
      </el-select>

      <el-dropdown trigger="click" @command="handleThemeChange">
        <button type="button" class="header-icon-btn theme-switcher" :title="themeButtonTitle">
          <el-icon><Setting /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in availableThemes"
              :key="item.mode"
              :command="item.mode"
              :class="{ 'is-active': currentMode === item.mode }"
            >
              {{ themeLabel(item.mode) }}
              <el-icon v-if="currentMode === item.mode" class="check-icon">
                <Check />
              </el-icon>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 用户 -->
      <el-dropdown
        trigger="click"
        popper-class="user-menu-popper"
        @command="handleUserCommand"
        @visible-change="onUserMenuVisible"
      >
        <button type="button" class="header-trigger user-trigger">
          <span class="trigger-label">{{ userLabel }}</span>
          <el-icon class="trigger-icon"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <div class="user-menu-identity">
              <div class="user-menu-name">{{ userLabel }}</div>
              <div v-if="organ" class="user-menu-organ">{{ organ.name }}</div>
            </div>
            <el-dropdown-item command="passport" :disabled="!isLoggedIn">
              {{ $t('MS_PP_TITLE', '账号管理') }}
            </el-dropdown-item>
            <!-- 切换身份：员工会话展示，列表超出约 5 条时单独滚动 -->
            <div v-if="isUserSession" class="user-menu-switch">
              <div class="user-menu-title">{{ $t('MS_HDR_SWITCH_IDENTITY', '切换身份') }}</div>
              <div class="user-menu-identities">
                <el-dropdown-item
                  v-for="item in identities"
                  :key="String(item.userId)"
                  :command="`${SWITCH_PREFIX}${item.userId}`"
                  :disabled="switching"
                  :class="{ 'is-active': String(item.userId) === currentUserId }"
                >
                  <span class="identity-text">
                    <span
                      class="identity-organ"
                      :title="item.organName || $t('MS_HDR_ORGAN_UNNAMED', '未命名机构')"
                    >
                      {{ item.organName || $t('MS_HDR_ORGAN_UNNAMED', '未命名机构') }}
                    </span>
                    <span v-if="item.userName" class="identity-user">{{ item.userName }}</span>
                  </span>
                  <el-icon v-if="String(item.userId) === currentUserId" class="check-icon"><Check /></el-icon>
                </el-dropdown-item>
              </div>
            </div>
            <el-dropdown-item command="logout" divided :disabled="!isLoggedIn">
              <el-icon><SwitchButton /></el-icon>
              {{ $t('MS_HDR_LOGOUT', '退出登录') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Check, Setting, SwitchButton } from '@element-plus/icons-vue'
import logoHeader from '@/assets/brand/logo-header.png'
import { t } from '../../platform/i18n'
import { getMainPlatform } from '../../platform/main-platform'
import { sso } from '../../runtime/auth/sso'
import { listIdentities, type UserIdentityVo } from '../../runtime/api/authority-user'
import { useLocaleStore } from '../../platform/stores/locale.store'
import { useThemeStore } from '../../platform/stores/theme.store'
import type { ThemeMode } from '../../platform/theme/types'
import { useRuntimeStore } from '../../platform/stores/runtime.store'
import { useSessionStore } from '../../platform/stores/session.store'
import { useAccessTokenStore } from '../../platform/stores/token.store'
import { useMenuStore } from '../../platform/stores/menu.store'
import { useWorkspaceStore } from '../../platform/stores/workspace.store'
import {
  clearReturnUrl,
  resetNavigationRestoreState,
} from '../../runtime/navigation/sub-app-redirect'

const router = useRouter()
const session = useSessionStore()
const localeStore = useLocaleStore()
const themeStore = useThemeStore()
const runtimeStore = useRuntimeStore()
const tokenStore = useAccessTokenStore()
const menuStore = useMenuStore()
const workspace = useWorkspaceStore()

const { user, organ, isLoggedIn } = storeToRefs(session)

const currentMode = computed(() => themeStore.currentMode)
const availableThemes = computed(() => themeStore.availableThemes)

const THEME_I18N: Record<ThemeMode, [string, string]> = {
  light: ['MS_THEME_LIGHT', '亮色主题'],
  dark: ['MS_THEME_DARK', '暗色主题'],
}

function themeLabel(mode: ThemeMode): string {
  const [key, def] = THEME_I18N[mode]
  return t(key, def)
}

const themeButtonTitle = computed(
  () => `${t('MS_HDR_THEME', '当前主题')}: ${themeLabel(currentMode.value)}`,
)

const selectedLocale = computed({
  get: () => localeStore.locale,
  set: (code: string) => {
    void applyLocale(code)
  },
})

const userLabel = computed(() => {
  if (!user.value) return t('G2_ERR_NO_LOGIN', '未登录')
  return user.value.displayName
})

async function handleThemeChange(mode: ThemeMode): Promise<void> {
  try {
    await themeStore.setTheme(mode)
  } catch (error) {
    console.error('[Header] 切换主题失败:', error)
  }
}

async function applyLocale(next: string): Promise<void> {
  await localeStore.setLocale(next)
  const main = getMainPlatform()
  const instanceIds = [...runtimeStore.instances.keys()]
  await Promise.all(instanceIds.map((instanceId) => main.notifyLocale(instanceId, next)))
}

watch(
  () => tokenStore.isLogin,
  (loggedIn) => {
    if (loggedIn && !localeStore.initialized) {
      void localeStore.initialize().catch((error) => {
        console.error('[Header] 语言列表初始化失败:', error)
      })
    }
  },
)

/** 切换身份命令前缀：`switch:<userId>` */
const SWITCH_PREFIX = 'switch:'

/** 当前账号在本应用中可切换的身份；每次打开用户菜单时刷新 */
const identities = ref<UserIdentityVo[]>([])
const switching = ref(false)
const currentUserId = computed(() => tokenStore.token?.userId)

/** 账号会话（尚未选定身份）走账号开通流程，不展示切换 */
const isUserSession = computed(() => tokenStore.token?.sessionType === 'USER')

async function onUserMenuVisible(visible: boolean): Promise<void> {
  if (!visible || !isUserSession.value) return
  try {
    identities.value = await listIdentities()
  } catch (error) {
    console.warn('[Header] 查询可切换身份失败:', error)
  }
}

/** 切换到同账号下的其他身份：确认后换票，整页回到首页，已打开的页签与子应用随之关闭 */
async function switchIdentity(userId: string): Promise<void> {
  if (userId === currentUserId.value || switching.value) return
  const target = identities.value.find((item) => String(item.userId) === userId)
  const organName = target?.organName || t('MS_HDR_ORGAN_UNNAMED', '未命名机构')
  try {
    await ElMessageBox.confirm(
      t('MS_HDR_SWITCH_CONFIRM', { organ: organName }, '切换后将关闭所有已打开的页面，确定切换到「{organ}」吗？'),
      t('MS_HDR_SWITCH_IDENTITY', '切换身份'),
      {
        type: 'warning',
        confirmButtonText: t('G2_BTN_CONFIRM', '确定'),
        cancelButtonText: t('G2_BTN_CANCEL', '取消'),
      },
    )
  } catch {
    return
  }

  switching.value = true
  try {
    await sso.switchToken(userId)
    window.location.assign(router.resolve('/').href)
  } catch (error) {
    ElMessage.error(
      error instanceof Error && error.message
        ? error.message
        : t('MS_HDR_SWITCH_FAIL', '切换失败，请稍后再试'),
    )
    switching.value = false
  }
}

async function handleUserCommand(command: string): Promise<void> {
  if (command.startsWith(SWITCH_PREFIX)) {
    await switchIdentity(command.slice(SWITCH_PREFIX.length))
    return
  }
  if (command === 'passport') {
    workspace.openShellView({
      viewId: 'shell.passport',
      title: t('MS_PP_TITLE', '账号管理'),
      kind: 'shell',
      closable: true,
      shellPage: 'passport',
    })
    return
  }
  if (command !== 'logout') return
  await runtimeStore.releaseAllOnLogout()
  menuStore.reset()
  clearReturnUrl()
  resetNavigationRestoreState()
  tokenStore.logout()
  session.clearSession()
  await router.push('/logout')
}
</script>

<style scoped>
.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--g2-border-color);
  background: var(--g2-bg-container);
  color: var(--g2-text-primary);
}

.logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-image {
  display: block;
  height: 36px;
  width: auto;
  max-width: min(320px, 42vw);
  object-fit: contain;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.locale-select {
  width: 150px;
}

.locale-select :deep(.el-select__wrapper) {
  background-color: var(--g2-bg-muted);
  box-shadow: 0 0 0 1px var(--g2-border-color) inset;
}

.locale-select :deep(.el-select__placeholder),
.locale-select :deep(.el-select__selected-item) {
  color: var(--g2-text-regular);
}

.header-trigger,
.header-icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--g2-border-color);
  background: var(--g2-bg-muted);
  color: var(--g2-text-regular);
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  line-height: 1.2;
}

.header-trigger:disabled,
.header-icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.header-icon-btn {
  padding: 6px 8px;
}

.theme-switcher:hover {
  border-color: var(--g2-color-primary);
  color: var(--g2-color-primary);
}

.user-trigger {
  max-width: 220px;
}

.trigger-label {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--g2-text-primary);
}

.trigger-icon {
  font-size: 12px;
  color: var(--g2-text-secondary);
}

:deep(.el-dropdown-menu__item.is-active) {
  color: var(--g2-color-primary);
  font-weight: 600;
}

:deep(.check-icon) {
  margin-left: 8px;
  color: var(--g2-color-primary);
}
</style>

<style>
/* 下拉菜单渲染在 body 下，scoped 样式不生效；固定宽度，长机构名换行而不是撑宽菜单 */
.user-menu-popper .el-dropdown-menu {
  width: 260px;
  box-sizing: border-box;
}

/* 顶部：当前姓名与机构 */
.user-menu-popper .user-menu-identity {
  padding: 8px 16px 10px;
  border-bottom: 1px solid var(--g2-border-color);
}

.user-menu-popper .user-menu-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--g2-text-primary);
  word-break: break-all;
}

.user-menu-popper .user-menu-organ {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--g2-text-secondary);
  word-break: break-all;
}

/* 身份列表区块：上边框与"账号管理"分隔；列表约 5 条高度后滚动，退出登录始终可见 */
.user-menu-popper .user-menu-switch {
  margin-top: 6px;
  border-top: 1px solid var(--g2-border-color);
}

.user-menu-popper .user-menu-identities {
  max-height: 260px;
  overflow-y: auto;
}

.user-menu-popper .user-menu-title {
  padding: 8px 16px 4px;
  font-size: 12px;
  color: var(--g2-text-secondary);
}

/* 身份项：机构名（最多两行）在上、姓名在下，勾选靠右 */
.user-menu-popper .el-dropdown-menu__item:has(.identity-text) {
  align-items: center;
  padding-top: 6px;
  padding-bottom: 6px;
  line-height: 1.4;
}

.user-menu-popper .identity-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.user-menu-popper .identity-organ {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-weight: 500;
  word-break: break-all;
  white-space: normal;
}

.user-menu-popper .identity-user {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--g2-text-secondary);
}

.user-menu-popper .check-icon {
  flex-shrink: 0;
  color: var(--g2-color-primary);
}
</style>
