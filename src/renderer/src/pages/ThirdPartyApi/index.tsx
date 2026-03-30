import { useEffect } from 'react'
import { Modal, Switch } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { getSupplierList, multipleModelStatusChange } from './controller'
import SupplierList from './SupplierList'
import ConfigurTop from './ConfigurTop'
import SupplierModelList from './SupplierModelList'
import AddModel from './AddModel'
import DelModelConfirm from './DelModelConfirm'
import AddSupplier from './AddSupplier'
import DelSupplierConfirm from './DelSupplierConfirm'

export default function ThirdPartyApi() {
  const { t } = useTranslation()
  const show = useThirdPartyApiStore((s) => s.thirdPartyApiShow)
  const setShow = useThirdPartyApiStore((s) => s.setThirdPartyApiShow)
  const currentChooseApi = useThirdPartyApiStore((s) => s.currentChooseApi)
  const isAllModelEnable = useThirdPartyApiStore((s) => s.isAllModelEnable)
  const setAddSupplierModel = useThirdPartyApiStore((s) => s.setAddSupplierModel)

  useEffect(() => {
    if (show) getSupplierList()
  }, [show])

  return (
    <>
      <Modal
        open={show}
        onCancel={() => setShow(false)}
        title={t('第三方API配置')}
        footer={null}
        width={740}
        destroyOnClose
      >
        <div className="flex" style={{ width: 680, height: 560, overflow: 'hidden' }}>
          <SupplierList />
          {currentChooseApi && (
            <div className="flex-1 pl-20">
              <ConfigurTop />
              <div className="mt-20">
                <div className="flex justify-between items-center mb-10 pr-20">
                  <div>
                    {t('模型')}
                    <span className="text-gray-4 text-12 ml-8">
                      {t('默认从/models获取所有模型')}
                    </span>
                  </div>
                  <div className="flex items-center gap-8">
                    {t('开关所有')}
                    <Switch
                      size="small"
                      checked={isAllModelEnable}
                      onChange={multipleModelStatusChange}
                    />
                  </div>
                </div>
                <div className="mb-10">
                  <span
                    className="cursor-pointer text-blue-5 flex items-center gap-4"
                    onClick={() => setAddSupplierModel(true)}
                  >
                    <span className="i-proicons:add-circle w-18 h-18" />
                    {t('添加模型')}
                  </span>
                </div>
                <SupplierModelList />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <AddModel />
      <DelModelConfirm />
      <AddSupplier />
      <DelSupplierConfirm />
    </>
  )
}
