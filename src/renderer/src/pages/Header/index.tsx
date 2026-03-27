import { useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { ShareAltOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import useHeaderStore from '@/stores/header'
import useSiderStore from '@/stores/sider'
import useKnowledgeStore from '@/stores/knowledge'
import ChooseModel from './ChooseModel'
import { getModelList, doExpand } from './controller'
import './header.scss'

export default function Header() {
  const { t } = useTranslation()
  const siderWidth = useSiderStore((s) => s.siderWidth)
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)
  const shareShow = useHeaderStore((s) => s.shareShow)

  useEffect(() => {
    getModelList()
  }, [])

  if (activeKnowledge) return null

  return (
    <div className="header-container">
      <div className="header-left">
        <Tooltip title={siderWidth === 0 ? t('展开侧栏') : t('收起侧栏')}>
          <Button
            type="text"
            icon={siderWidth === 0 ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={doExpand}
          />
        </Tooltip>
        <ChooseModel />
      </div>
      <div className="header-right">
        <Tooltip title={t('分享')}>
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={() => useHeaderStore.getState().setShareShow(true)}
          />
        </Tooltip>
      </div>
    </div>
  )
}
