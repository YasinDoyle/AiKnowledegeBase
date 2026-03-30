import { Modal, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import { cancelChangeDataSavePath, confirmChangeDataSavePath } from './controller'

export default function ChangeDirWarning() {
  const { t } = useTranslation()
  const show = useSoftSettingsStore((s) => s.changeDataPathShow)

  return (
    <Modal
      open={show}
      closable={false}
      title={t('提示')}
      width={500}
      footer={
        <div className="flex justify-end gap-8">
          <Button onClick={cancelChangeDataSavePath}>{t('取消')}</Button>
          <Button type="primary" danger onClick={confirmChangeDataSavePath}>
            {t('选择新位置')}
          </Button>
        </div>
      }
    >
      <span>
        {t('切换目录会将旧目录数据迁移到新目录,视数据大小可能需要5-10分钟，迁移过程中请勿关闭软件')}
      </span>
    </Modal>
  )
}
