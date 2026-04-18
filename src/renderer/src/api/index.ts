/**
 * IPC API 层 — 替代 Axios HTTP
 *
 * ipcInvoke('chat:get_chat_list', params)
 *
 * 通道命名规则与 ipc-register.ts 一致：'controller:method'
 */

export type IpcResult = {
  message: any
  status: number
  code: number
  msg?: string
  error_msg?: string
}

/**
 * 统一 IPC 调用封装
 * @param channel - IPC 通道名，如 'chat:get_chat_list'
 * @param params  - 传递给 controller 方法的参数
 */

export async function ipcInvoke<T = any>(channel: string, params?: T): Promise<IpcResult> {
  return window.ipcRenderer.invoke(channel, params)
}

/**
 * listener 注册表：存储 listener → preload 返回的 ID，用于 off 时精确移除
 */
const listenerIdMap = new Map<Function, number>()

/**
 * 监听主进程推送的消息（用于流式数据等）
 * preload on() 返回数字 ID，contextBridge 同步传递原始类型
 */
export function ipcOn(channel: string, listener: (...args: any[]) => void) {
  const id = (window.ipcRenderer as any).on(channel, listener) as number
  listenerIdMap.set(listener, id)
}

/**
 * 移除监听
 */
export function ipcOff(channel: string, listener: (...args: any[]) => void) {
  const id = listenerIdMap.get(listener)
  if (id != null) {
    window.ipcRenderer.off(channel, id as any)
    listenerIdMap.delete(listener)
  }
}
