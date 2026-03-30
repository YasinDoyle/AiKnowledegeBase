import { Input, Button, Switch, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import {
  changeCurrentSupplierStatus,
  jumpToHelp,
  delSupplier,
  getKey,
  checkConfig,
  saveConfig,
} from './controller'

export default function ConfigurTop() {
  const { t } = useTranslation()
  const currentChooseApi = useThirdPartyApiStore((s) => s.currentChooseApi)
  const config = useThirdPartyApiStore((s) => s.applierServiceConfig)
  const setConfig = useThirdPartyApiStore((s) => s.setApplierServiceConfig)

  if (!currentChooseApi) return null

  return (
    <>
      {/* 标题栏 */}
      <div className="flex justify-between items-center border-b border-gray-2 pb-12">
        <div className="flex items-center gap-8">
          <Tooltip title={t('使用教程')}>
            <span
              className="i-ci:circle-warning w-18 h-18 cursor-pointer"
              onClick={() => jumpToHelp(currentChooseApi.help)}
            />
          </Tooltip>
          <span className="font-bold">{currentChooseApi.supplierTitle}</span>
        </div>
        <div className="flex items-center gap-12">
          <Switch
            size="small"
            checked={currentChooseApi.status}
            onChange={(v) => changeCurrentSupplierStatus(currentChooseApi.supplierName, v)}
          />
          {!currentChooseApi.home && (
            <Tooltip title={t('删除服务商')}>
              <span
                className="i-weui:delete-outlined w-20 h-20 cursor-pointer"
                onClick={delSupplier}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* API 密钥 */}
      <div className="mt-10">
        <div className="mb-4">{t('API密钥')}</div>
        <Input.Group compact>
          <Input
            placeholder={t('请输入API密钥')}
            value={config.apiKey}
            onChange={(e) => setConfig({ apiKey: e.target.value })}
            style={{ width: 'calc(100% - 60px)' }}
          />
          <Button onClick={checkConfig}>{t('检查')}</Button>
        </Input.Group>
        <Button type="link" size="small" onClick={() => getKey(currentChooseApi.home)}>
          {t('点此获取密钥')}
        </Button>
      </div>

      {/* API 地址 */}
      <div className="mt-10">
        <div className="mb-4">{t('API地址')}</div>
        <Input
          placeholder={t('请输入API地址')}
          value={config.baseUrl}
          onChange={(e) => setConfig({ baseUrl: e.target.value })}
        />
        <div className="text-12 text-gray-4 mt-2">
          {t('示例')}: {currentChooseApi.baseUrlExample}
        </div>
      </div>

      <div className="mt-10">
        <Button type="primary" onClick={saveConfig}>
          {t('保存API')}
        </Button>
      </div>
    </>
  )
}
