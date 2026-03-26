import { Layout } from 'antd'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/stores/global'
import './index.scss'
import { use } from 'i18next'

const { Sider, Header, Content } = Layout

function Home() {
  const { t } = useTranslation()
  const siderBg = useGlobalStore((s) => s.siderBg)

  return (
    <Layout className="layout-wrapper">
      {/*左侧导航栏*/}
      <Sider width={80} className="layout-sider" style={{ background: siderBg }}>
        <div className="p-2 text-center">{t('智能体')}</div>
      </Sider>
      {/*知识库栏*/}
      <Sider width={240} className="layout-sider knowledge-sider" style={{ background: siderBg }}>
        <div className="p-2"> {t('知识库')}</div>
      </Sider>
      {/*主内容区*/}
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
