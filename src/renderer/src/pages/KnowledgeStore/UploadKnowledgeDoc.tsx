import { Modal, Button, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { cancelUpload, doUpload, chooseFiles, chooseDir, removeFile } from './controller'
import { getFileNameFromPath } from '@/utils/tools'

export default function UploadKnowledgeDoc() {
  const { t } = useTranslation()
  const show = useKnowledgeStore((s) => s.knowledgeUploadDocShow)
  const isUploading = useKnowledgeStore((s) => s.isUploadingDoc)
  const fileList = useKnowledgeStore((s) => s.fileOrDirList)

  return (
    <Modal
      open={show}
      onCancel={cancelUpload}
      title={t('上传文档')}
      width={600}
      footer={
        <div className="flex justify-end gap-8">
          <Button onClick={cancelUpload}>{t('取消')}</Button>
          <Button type="primary" onClick={doUpload} loading={isUploading}>
            {t('确认上传')}
          </Button>
        </div>
      }
    >
      {isUploading ? (
        <div className="flex justify-center items-center py-40">
          <Spin tip={t('正在上传...')} />
        </div>
      ) : (
        <div>
          <div className="flex gap-8 mb-16">
            <Button onClick={chooseFiles}>{t('选择文件')}</Button>
            <Button onClick={chooseDir}>{t('选择文件夹')}</Button>
          </div>
          <div className="text-12 text-gray-5 mb-10">
            {t('支持格式')}: txt, md, pdf, docx, xlsx, csv, html, json
          </div>
          <div className="flex flex-col gap-4 max-h-300 overflow-y-auto">
            {fileList.map((filePath, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-6 border border-gray-2 rounded"
              >
                <span className="truncate flex-1">{getFileNameFromPath(filePath)}</span>
                <span
                  className="i-weui:delete-outlined w-16 h-16 cursor-pointer hover:text-red-5"
                  onClick={() => removeFile(idx)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
