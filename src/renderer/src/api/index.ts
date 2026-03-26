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
