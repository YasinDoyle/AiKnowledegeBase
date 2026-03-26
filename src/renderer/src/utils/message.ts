import { message, Modal } from 'antd'
export { message }
/**
 * 删除确认弹窗 — 替代 naive-tools 的 delConfirm
 */
export function delConfirm(options: { title: string; content: string }): Promise<boolean> {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title: options.title,
      content: options.content,
      okText: '确认',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => reject(false),
    })
  })
}
