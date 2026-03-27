import { useEffect } from 'react'
import { Modal, Input, Switch, Table, Button, Tooltip, Popconfirm } from 'antd'
import { CopyOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import useHeaderStore from '@/stores/header'
import type { ShareItem } from '@/stores/header'
import {
  getShareList,
  createShare,
  modifyShare,
  delShare,
  openModifyShare,
  closeShare,
  closeModifyShare,
} from './controller'
import { message } from '@/utils/message'
import { isoToLocalDateTime } from '@/utils/tools'

export default function Share() {
  const { t } = useTranslation()
  const shareShow = useHeaderStore((s) => s.shareShow)
  const shareList = useHeaderStore((s) => s.shareList)
  const shareCreateShow = useHeaderStore((s) => s.shareCreateShow)
  const shareModifyShow = useHeaderStore((s) => s.shareModifyShow)

  useEffect(() => {
    if (shareShow) getShareList()
  }, [shareShow])

  const columns = [
    {
      title: t('标题'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: t('创建时间'),
      dataIndex: 'create_time',
      key: 'create_time',
      render: (v: number) => isoToLocalDateTime(v),
    },
    {
      title: t('操作'),
      key: 'action',
      width: 140,
      render: (_: unknown, record: ShareItem) => (
        <div className="flex gap-5px">
          <Tooltip title={t('复制链接')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                const url = record.url || `http://127.0.0.1:7071/share/${record.share_id}`
                navigator.clipboard.writeText(url)
                message.success(t('复制成功'))
              }}
            />
          </Tooltip>
          <Tooltip title={t('编辑')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModifyShare(record)}
            />
          </Tooltip>
          <Popconfirm title={t('确认删除?')} onConfirm={() => delShare(record.share_id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* 分享管理 */}
      <Modal title={t('分享管理')} open={shareShow} onCancel={closeShare} footer={null} width={700}>
        <div className="mb-10px flex justify-end">
          <Button type="primary" onClick={() => useHeaderStore.getState().setShareCreateShow(true)}>
            {t('新建分享')}
          </Button>
        </div>
        <Table
          dataSource={shareList}
          columns={columns}
          rowKey="share_id"
          pagination={false}
          size="small"
        />
      </Modal>

      {/* 新建分享 */}
      <Modal
        title={t('新建分享')}
        open={shareCreateShow}
        onOk={createShare}
        onCancel={() => useHeaderStore.getState().setShareCreateShow(false)}
      >
        <ShareForm />
      </Modal>

      {/* 修改分享 */}
      <Modal
        title={t('修改分享')}
        open={shareModifyShow}
        onOk={modifyShare}
        onCancel={closeModifyShare}
      >
        <ShareForm />
      </Modal>
    </>
  )
}

function ShareForm() {
  const { t } = useTranslation()
  const shareTitle = useHeaderStore((s) => s.shareTitle)
  const sharePassword = useHeaderStore((s) => s.sharePassword)
  const shareIsUseContext = useHeaderStore((s) => s.shareIsUseContext)

  return (
    <div className="flex flex-col gap-15px">
      <div>
        <div className="mb-5px">{t('标题')}</div>
        <Input
          value={shareTitle}
          onChange={(e) => useHeaderStore.getState().setShareTitle(e.target.value)}
          placeholder={t('请输入分享标题')}
        />
      </div>
      <div>
        <div className="mb-5px">{t('密码')}</div>
        <Input.Password
          value={sharePassword}
          onChange={(e) => useHeaderStore.getState().setSharePassword(e.target.value)}
          placeholder={t('不填则无需密码')}
        />
      </div>
      <div className="flex items-center gap-10px">
        <span>{t('使用上下文')}</span>
        <Switch
          checked={shareIsUseContext === 1}
          onChange={(v) => useHeaderStore.getState().setShareIsUseContext(v ? 1 : 0)}
        />
      </div>
    </div>
  )
}
