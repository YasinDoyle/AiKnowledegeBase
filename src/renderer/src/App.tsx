import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import useGlobalStore from '@/stores/global'
import router from '@/router'

function App() {
  const themMode = useGlobalStore((s) => s.themeMode)
  return (
    <ConfigProvider
      theme={{
        algorithm: themMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: 'rgb(97, 189, 241)',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

export default App
