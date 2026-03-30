import { useEffect } from 'react'
import { List, Switch, Input, Select, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import useChatContentStore from '@/stores/chatContent'
import {
  getDataSavePath,
  changeDataSavePath,
  toStar,
  toIssue,
  jumpToTutorial,
  guideChange,
  setSearch,
  changeThemeMode,
  changeLanguage,
  getLanguages,
} from './controller'
import wechat from '@/assets/images/wechat.png'

export default function GeneralSettings() {
  const { t } = useTranslation()
  const themeMode = useSoftSettingsStore((s) => s.themeMode)
  const languageOptions = useSoftSettingsStore((s) => s.languageOptions)
  const currentLanguage = useSoftSettingsStore((s) => s.currentLanguage)
  const targetNet = useSoftSettingsStore((s) => s.targetNet)
  const version = useSoftSettingsStore((s) => s.version)
  const userDataPath = useSoftSettingsStore((s) => s.userDataPath)
  const guideActive = useChatContentStore((s) => s.guideActive)

  useEffect(() => {
    getDataSavePath()
    getLanguages()
  }, [])

  const searchOptions = [
    { label: t('百度'), value: 'baidu' },
    { label: t('搜狗'), value: 'sogou' },
    { label: t('360搜索'), value: '360' },
  ]

  return (
    <List>
      <List.Item>
        <div className="w-full flex justify-between items-center">
          <span>{t('新手指引')}</span>
          <Switch size="small" checked={guideActive} onChange={(v) => guideChange(v)} />
        </div>
      </List.Item>
      <List.Item>
        <div className="w-full flex justify-between items-center">
          <span>{themeMode === 'light' ? t('浅色模式') : t('深色模式')}</span>
          <Switch
            size="small"
            checked={themeMode === 'dark'}
            onChange={(v) => changeThemeMode(v ? 'dark' : 'light')}
          />
        </div>
      </List.Item>
      <List.Item>
        <div className="w-full flex justify-between items-center">
          <span>{t('数据存储位置')}</span>
          <Input.Group compact style={{ width: 'auto' }}>
            <Input value={userDataPath} readOnly style={{ width: 200 }} />
            <Button onClick={changeDataSavePath}>{t('更改')}</Button>
          </Input.Group>
        </div>
      </List.Item>
      <List.Item>
        <div className="w-full flex justify-between items-center">
          <span>{t('语言选择')}</span>
          <Select
            options={languageOptions}
            value={currentLanguage}
            onChange={changeLanguage}
            style={{ width: 120 }}
          />
        </div>
      </List.Item>
      <List.Item>
        <div className="w-full flex justify-between items-center">
          <span>{t('默认搜索引擎')}</span>
          <Select
            options={searchOptions}
            value={targetNet}
            onChange={setSearch}
            style={{ width: 120 }}
          />
        </div>
      </List.Item>
      <List.Item>
        <div className="w-full flex justify-between items-center">
          <span>Github</span>
          <Button.Group>
            <Button onClick={toStar}>
              <span className="i-common:star w-16 h-16 mr-4" />
              star
            </Button>
            <Button onClick={toIssue}>
              <span className="i-common:issues w-16 h-16 mr-4" />
              {t('反馈')}
            </Button>
          </Button.Group>
        </div>
      </List.Item>
      <List.Item>
        <div className="w-full flex flex-col items-center gap-2">
          <span>{t('加入AiKnowledgeBase交流群')}</span>
          <img src={wechat} alt="wechat" width={100} />
        </div>
      </List.Item>
      <List.Item>
        <div className="w-full flex justify-center gap-2 text-gray-5">
          <span>
            {t('当前版本')}: v{version}
          </span>
          <span className="underline text-green-6 cursor-pointer" onClick={jumpToTutorial}>
            {t('文档教程')}
          </span>
        </div>
      </List.Item>
    </List>
  )
}
