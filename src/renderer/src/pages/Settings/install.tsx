import { Modal, Progress, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import useSettingsStore from '@/stores/settings'
import { reconnectModelDownload } from './controller'
import { getByteUnit } from '@/utils/tools'

export default function Install() {
  const { t } = useTranslation()
  const installShow = useSettingsStore((s) => s.installShow)
  const progress = useSettingsStore((s) => s.modelInstallProgress)
  const downloadText = useSettingsStore((s) => s.downloadText)

  return (
    <Modal open={installShow} closable={false} footer={null} width={500}>
      <div className="font-bold mb-12">{downloadText}</div>
      <Progress percent={progress.progress ?? 0} />
      <div className="flex mt-16 gap-10 text-12">
        <span>
          {t('模型大小:')} {getByteUnit(progress.total)}
        </span>
        <span>
          {t('已下载:')} {getByteUnit(progress.completed)}
        </span>
        <span className="flex items-center">
          {t('速度:')} {getByteUnit(progress.speed)}/s
          <Tooltip
            title={t(
              '尝试重新选择下载节点，以优化下载速度，PS:不会丢失当前下载进度，将自动断点续传。',
            )}
          >
            <span
              className="i-common:refresh w-16 h-16 cursor-pointer ml-4"
              onClick={reconnectModelDownload}
            />
          </Tooltip>
        </span>
      </div>
    </Modal>
  )
}
