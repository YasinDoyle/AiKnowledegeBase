import { type AppConfig } from '../lib/utils'

const config: () => AppConfig = () => {
  return {
    openDevTools: false,
  }
}

export default config
