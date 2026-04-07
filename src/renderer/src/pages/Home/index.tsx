import { Layout } from 'antd'
import useGlobalStore from '@/stores/global'
import useSiderStore from '@/stores/sider'
import Sider from '@/pages/Sider'
import HeaderBar from '@/pages/Header'
import ChatContent from '@/pages/ChatContent'
import Agent from '@/pages/Agent'
import ThirdPartyApi from '@/pages/ThirdPartyApi'
import Settings from '@/pages/Settings'
import SoftSettings from '@/pages/SoftSettings'
import CreateKnowledgeStore from '@/pages/KnowledgeStore/CreateKnowledgeStore'
import './index.scss'

const { Header, Content } = Layout

function Home() {
  const siderBg = useGlobalStore((s) => s.siderBg)
  const siderWidth = useSiderStore((s) => s.siderWidth)

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

      {/* 主内容区 */}
      <Layout>
        <Header className="layout-header">
          <HeaderBar />
        </Header>
        <Content className="layout-content">
          <ChatContent />
        </Content>
      </Layout>

      {/* 全局弹窗层 */}
      <Agent />
      <ThirdPartyApi />
      <Settings />
      <SoftSettings />
      <CreateKnowledgeStore />
    </Layout>
  )
}

export default Home
