import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { chooseApiService } from './controller'

export default function SupplierList() {
  const { t } = useTranslation()
  const list = useThirdPartyApiStore((s) => s.thirdPartyApiServiceList)
  const current = useThirdPartyApiStore((s) => s.currentChooseApi)
  const setAddSupplierShow = useThirdPartyApiStore((s) => s.setAddSupplierShow)

  return (
    <div className="w-220 border-r border-gray-2 pr-20">
      <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
        {list.map((item) => (
          <div
            key={item.supplierName}
            className={`flex items-center gap-8 p-8 cursor-pointer rounded ${current?.supplierName === item.supplierName ? 'bg-[var(--bt-list-item-hover)]' : 'hover:bg-[var(--bt-list-item-hover)]'}`}
            onClick={() => chooseApiService(item)}
          >
            {item.icon && <img src={item.icon} alt="" className="w-20 h-20" />}
            <span>{item.supplierTitle}</span>
          </div>
        ))}
      </div>
      <Button className="w-full mt-20" ghost onClick={() => setAddSupplierShow(true)}>
        {t('添加模型服务商')}
      </Button>
    </div>
  )
}
