import { ipcRenderer, contextBridge } from 'electron'

// contextIsolation 下函数引用跨 bridge 无法匹配，用自增 ID 跟踪 listener
let nextListenerId = 1
const listenerRegistry = new Map<number, (...args: any[]) => void>()

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: any[]) => void): number {
    const id = nextListenerId++
    const wrapper = (event: Electron.IpcRendererEvent, ...args: any[]) => listener(event, ...args)
    listenerRegistry.set(id, wrapper)
    ipcRenderer.on(channel, wrapper)
    return id
  },
  off(channel: string, id: number) {
    const wrapper = listenerRegistry.get(id)
    if (wrapper) {
      ipcRenderer.off(channel, wrapper)
      listenerRegistry.delete(id)
    }
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})
