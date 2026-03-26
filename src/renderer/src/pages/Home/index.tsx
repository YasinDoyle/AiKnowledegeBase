import { Layout } from 'antd'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/stores/global'
import useSiderStore from '@/stores/sider'
import useKnowledgeStore from '@/stores/knowledge'
import Sider from '@/pages/Sider'
import './index.scss'
import { use } from 'i18next'

const { Header, Content } = Layout

function Home() {
  const { t } = useTranslation()
  const siderBg = useGlobalStore((s) => s.siderBg)
  const siderWidth = useSiderStore((s) => s.siderWidth)
  const knowledgeSiderWidth = useKnowledgeStore((s) => s.knowledgeSiderWidth)

  return (
    <Layout className="layout-wrapper">
      {/* 侧边栏 */}
      <Layout.Sider
        width={siderWidth}
        className="layout-sider"
        style={{ background: siderBg, display: siderWidth === 0 ? 'none' : undefined }}
      >
        <Sider />
      </Layout.Sider>

      {/* 知识库侧栏 — Phase 5 填充 */}
      {knowledgeSiderWidth > 0 && (
        <Layout.Sider
          width={knowledgeSiderWidth}
          className="layout-sider"
          style={{ background: siderBg }}
        >
          <div className="p-2">{t('知识库')}</div>
        </Layout.Sider>
      )}

      {/* 主内容区 */}
      <Layout>
        <Header className="layout-header">
          <span>{t('对话')}</span>
        </Header>
        <Content className="layout-content">
          <div className="p-4">{t('欢迎使用')}</div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default Home
