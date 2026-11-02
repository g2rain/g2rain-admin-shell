/**
 * dict 相关类型（DictSelect / DictText）
 */

export interface DictItem {
  id?: number
  parentId: number
  parentName?: string
  usageCode: string
  code: string
  name: string
  description: string
  sortIndex: number
}
