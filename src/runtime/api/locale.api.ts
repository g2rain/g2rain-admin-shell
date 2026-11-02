/**
 * 地域语言（Locale）相关 API
 * Shell 层跨应用能力（如 Header 语言选择）使用
 */

import { getHttpClient } from '../http'

/** 对应后端 LocaleCodeNameVo */
export interface LocaleCodeName {
  /** 语言区域编码，如 zh-CN */
  code: string
  /** 语言区域名称 */
  name: string
}

/** 获取地域语言编码与名称列表 */
export async function getLocaleCodeNameList(): Promise<LocaleCodeName[]> {
  const http = getHttpClient()
  const result = await http.client.get<LocaleCodeName[]>('/infra/locale_setting/code_name_map')
  return result.data ?? []
}
