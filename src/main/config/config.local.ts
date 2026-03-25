import { type AppConfig } from '../lib/utils'

const config: () => AppConfig = () => {
  return {
    openDevTools: {
      mode: 'bottom',
    },
    jobs: {
      messageLog: false,
    },
  }
}

export default config
