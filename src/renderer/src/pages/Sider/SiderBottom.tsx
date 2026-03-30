import { useTranslation } from 'react-i18next'
import { openThirdPartyModel } from './controller'
import { openAgent } from '../Agent/controller'
import { openModelManage } from '../Settings/controller'
import { openSoftSettings } from '../SoftSettings/controller'
import './SiderBottom.scss'

function SiderBottom() {
  const { t } = useTranslation()

  return (
    <ul className="recent-list">
      <li onClick={openAgent}>
        <div className="flex items-center justify-start">
          <i className="i-ph:star-four w-16 h-16 ml-8 mr-10 text-[var(--bt-tit-color-secondary)]" />
          <span>{t('智能体')}</span>
        </div>
      </li>
      <li onClick={openThirdPartyModel}>
        <div className="flex items-center justify-start">
          <i className="i-hugeicons:api w-16 h-16 ml-8 mr-10 text-[var(--bt-tit-color-secondary)]" />
          <span>{t('第三方模型API')}</span>
        </div>
      </li>
      <li onClick={openModelManage}>
        <div className="flex items-center justify-start">
          <i className="i-tdesign:desktop-1 w-16 h-16 ml-8 mr-10 text-[var(--bt-tit-color-secondary)]" />
          <span>{t('本地模型')}</span>
        </div>
      </li>
      <li onClick={openSoftSettings}>
        <div className="flex items-center justify-start">
          <i className="i-tdesign:setting-1 w-16 h-16 ml-8 mr-10 text-[var(--bt-tit-color-secondary)]" />
          <span>{t('设置')}</span>
        </div>
      </li>
    </ul>
  )
}

export default SiderBottom
