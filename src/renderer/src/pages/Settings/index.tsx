import { useEffect } from 'react'
import { Modal, Input, Button, Table, Tag, Radio } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import useSettingsStore from '@/stores/settings'
import useHeaderStore from '@/stores/header'
import {
  getVisibleModelList,
  getDiskList,
  setOllamaUrl,
  handleSearch,
  removeModelConfirm,
  installModelConfirm,
} from './controller'
import Install from './Install'
import DelModelProgress from './DelModelProgress'
import InstallModelManagerConfirm from './InstallModelManagerConfirm'
import ModelInstallProgress from './ModelInstallProgress'
import RemoveModelConfirm from './RemoveModelConfirm'

export default function Settings() {
  const { t } = useTranslation()
  const settingsShow = useSettingsStore((s) => s.settingsShow)
  const setSettingsShow = useSettingsStore((s) => s.setSettingsShow)
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl)
  const setOllamaUrlVal = useSettingsStore((s) => s.setOllamaUrl)
  const isInstalledManager = useSettingsStore((s) => s.isInstalledManager)
  const modeType = useSettingsStore((s) => s.modeType)
  const setModeType = useSettingsStore((s) => s.setModeType)
  const filterList = useSettingsStore((s) => s.filterList)
  const search = useSettingsStore((s) => s.search)
  const setSearch = useSettingsStore((s) => s.setSearch)
  const page = useSettingsStore((s) => s.page)
  const pageSize = useSettingsStore((s) => s.pageSize)
  const setPage = useSettingsStore((s) => s.setPage)
  const setPageSize = useSettingsStore((s) => s.setPageSize)
  const modelList = useHeaderStore((s) => s.modelList)

  useEffect(() => {
    if (settingsShow) {
      getVisibleModelList()
      getDiskList()
    } else {
      setModeType('all')
      setSearch('')
    }
  }, [settingsShow])

  const toolsList = [
    { label: t('所有'), value: 'all' },
    { label: 'LLM', value: 'llm' },
    { label: 'Vision', value: 'vision' },
    { label: 'Embedding', value: 'embedding' },
    { label: 'Tools', value: 'tools' },
    { label: t('已安装'), value: 'installed' },
  ]

  const columns: ColumnsType<any> = [
    {
      title: t('模型'),
      dataIndex: 'full_name',
      width: 160,
      render: (text: string, row: any) => (
        <span className="cursor-pointer text-green-6" onClick={() => window.open(row.link)}>
          {text}
        </span>
      ),
    },
    { title: t('大小'), dataIndex: 'download_size', width: 80 },
    {
      title: t('简介'),
      dataIndex: 'title',
      width: 265,
      ellipsis: true,
    },
    {
      title: t('功能'),
      dataIndex: 'capability',
      render: (caps: string[]) => caps?.map((c) => <Tag key={c}>{c}</Tag>),
    },
    {
      title: t('操作'),
      width: 80,
      render: (_: any, row: any) =>
        row.install ? (
          <Button size="small" danger onClick={() => removeModelConfirm(row.full_name)}>
            {t('删除')}
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            onClick={() => installModelConfirm({ model: row.model, parameters: row.parameters })}
          >
            {t('安装')}
          </Button>
        ),
    },
  ]

  return (
    <>
      <Modal
        open={settingsShow}
        onCancel={() => setSettingsShow(false)}
        title={t('设置')}
        footer={null}
        width={920}
        destroyOnClose
      >
        {/* Ollama URL */}
        <div className="flex items-center gap-8 mb-16">
          <Button>{t('Ollama接口地址')}</Button>
          <Input
            placeholder="请填写ollama接入地址"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrlVal(e.target.value)}
            style={{ width: 280 }}
          />
          <Button type="primary" onClick={setOllamaUrl}>
            {t('保存')}
          </Button>
          {!isInstalledManager && <span className="text-red-5">{t('当前ollama地址不可用')}</span>}
        </div>

        {modelList.length === 0 && <div className="mb-16">{t('首次使用，请选择要安装的模型')}</div>}

        {/* 搜索与筛选 */}
        <div className={`${!ollamaUrl ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center mb-10">
            <Input.Search
              placeholder={`${t('如:')} deepseek-r1`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 280 }}
            />
            <Radio.Group
              value={modeType}
              onChange={(e) => {
                setModeType(e.target.value)
                handleSearch()
              }}
              optionType="button"
              options={toolsList}
            />
          </div>
          <Table
            columns={columns}
            dataSource={filterList}
            rowKey="full_name"
            scroll={{ y: 400 }}
            pagination={{
              current: page,
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: [10, 50, 100],
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
          />
        </div>
      </Modal>

      <Install />
      <DelModelProgress />
      <InstallModelManagerConfirm />
      <ModelInstallProgress />
      <RemoveModelConfirm />
    </>
  )
}
