import { useMemo } from 'react'
import { Input, Tag, Card } from 'antd'
import { SearchOutlined, EyeOutlined, ToolOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import useHeaderStore from '@/stores/header'
import type { SupplierModelItem } from '@/types'

interface Props {
  onChoose: (model: string, supplier: string) => void
}

export default function ModelList({ onChoose }: Props) {
  const { t } = useTranslation()
  const modelListSource = useHeaderStore((s) => s.modelListSource)
  const filterKey = useHeaderStore((s) => s.modelListFilterKey)

  /** 按 supplierName 分组 & 关键字过滤 */
  const grouped = useMemo(() => {
    const result: Record<string, SupplierModelItem[]> = {}
    const key = filterKey.toLowerCase()
    Object.entries(modelListSource).forEach(([supplier, models]) => {
      const filtered = models.filter(
        (m) =>
          m.modelName.toLowerCase().includes(key) || (m.title || '').toLowerCase().includes(key),
      )
      if (filtered.length) result[supplier] = filtered
    })
    return result
  }, [modelListSource, filterKey])

  /** 常用模型 — 取每个 supplier 的第一个 */
  const commonModels = useMemo(() => {
    const list: SupplierModelItem[] = []
    Object.values(modelListSource).forEach((models) => {
      if (models.length) list.push(models[0])
    })
    return list
  }, [modelListSource])

  return (
    <Card className="model-list-card" styles={{ body: { padding: 12 } }}>
      <Input
        placeholder={t('搜索模型')}
        prefix={<SearchOutlined />}
        allowClear
        value={filterKey}
        onChange={(e) => useHeaderStore.getState().setModelListFilterKey(e.target.value)}
        className="mb-10px"
      />

      {/* 常用模型 */}
      {!filterKey && commonModels.length > 0 && (
        <div className="mb-10px">
          <div className="text-12px text-gray-5 mb-5px">{t('常用模型')}</div>
          {commonModels.map((m) => (
            <div
              key={`${m.supplierName}-${m.modelName}`}
              className="model-item"
              onClick={() => onChoose(m.modelName, m.supplierName)}
            >
              <span>{m.title || m.modelName}</span>
              <CapabilityTags capability={m.capability} />
            </div>
          ))}
        </div>
      )}

      {/* 分类列表 */}
      {Object.entries(grouped).map(([supplier, models]) => (
        <div key={supplier} className="mb-10px">
          <div className="text-12px text-gray-5 mb-5px">{supplier}</div>
          {models.map((m) => (
            <div
              key={`${m.supplierName}-${m.modelName}`}
              className="model-item"
              onClick={() => onChoose(m.modelName, m.supplierName)}
            >
              <span>{m.title || m.modelName}</span>
              <CapabilityTags capability={m.capability} />
            </div>
          ))}
        </div>
      ))}
    </Card>
  )
}

function CapabilityTags({ capability }: { capability?: string[] }) {
  if (!capability?.length) return null
  return (
    <span className="flex gap-4px">
      {capability.includes('vision') && (
        <Tag color="blue" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
          <EyeOutlined />
        </Tag>
      )}
      {capability.includes('tools') && (
        <Tag
          color="green"
          style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
        >
          <ToolOutlined />
        </Tag>
      )}
    </span>
  )
}
