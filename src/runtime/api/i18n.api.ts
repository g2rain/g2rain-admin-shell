/**
 * 前端国际化文案包 API（免登录也可拉；登录后随 locale 切换重拉）
 */

import { getAuthHttpClient } from '../http'
import { getI18nTags } from '../../shared/env'
import type { Result } from '@g2rain/http'

export interface I18nLocaleMessage {
  messageCode: string
  messageText: string
  extendField?: string
}

/**
 * 拉取本 Shell 页面 UI 文案
 * GET /api/infra/i18n_message/locale?tags=...&locale=zh-CN
 */
export async function fetchI18nLocaleMessages(locale: string): Promise<I18nLocaleMessage[]> {
  const http = getAuthHttpClient()
  const response = await http.client.get<I18nLocaleMessage[]>('/api/infra/i18n_message/locale', {
    params: {
      tags: getI18nTags(),
      locale: locale.trim(),
    },
  })
  const result = response as unknown as Result<I18nLocaleMessage[]>
  return result.data ?? []
}
