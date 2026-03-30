import { Tag, Switch, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { modelStatusChange, handleModelDataChange, delModel } from './controller'

export default function SupplierModelList() {
  const { t } = useTranslation()
  const supplierModelList = useThirdPartyApiStore((s) => s.supplierModelList)

  if (!supplierModelList.length) {
    return <div className="text-gray-5">{t('当前服务商下属暂无模型可用')}</div>
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
      {supplierModelList.map((item) => (
        <div
          key={item.modelName}
          className="flex justify-between items-center p-8 border-b border-gray-1"
        >
          <div className="flex items-center gap-8">
            <span>{item.title}</span>
            <Tooltip title={t('修改模型')}>
              <span
                className="i-proicons:text-edit-style w-16 h-16 cursor-pointer"
                onClick={() => handleModelDataChange(item as any)}
              />
            </Tooltip>
            {item.capability.map((c) => (
              <Tag key={c} className="text-12">
                {c}
              </Tag>
            ))}
          </div>
          <div className="flex items-center gap-8">
            <Switch
              size="small"
              checked={item.status}
              onChange={(v) => modelStatusChange(item.modelName, v)}
            />
            <span
              className="i-weui:delete-outlined w-20 h-20 cursor-pointer hover:text-red-5"
              onClick={() => delModel(item.modelName)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
