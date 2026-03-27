import { Tooltip, Image } from 'antd'
import useChatToolsStore from '@/stores/chatTools'
import { removeFile, removeImage } from './controller'
import pdfIcon from '@/assets/images/PDF.png'

export default function FileList() {
  const questionFiles = useChatToolsStore((s) => s.questionFiles)
  const questionFileList = useChatToolsStore((s) => s.questionFileList)
  const questionImageList = useChatToolsStore((s) => s.questionImageList)
  const questionImages = useChatToolsStore((s) => s.questionImages)

  return (
    <>
      {questionFiles.length > 0 && (
        <div className="upload-file-list">
          {questionFileList.map((item, index) => (
            <div key={index} className="file-item">
              <span
                className="del-file text-red-5 cursor-pointer"
                onClick={() => removeFile(index)}
              >
                ✕
              </span>
              <img src={pdfIcon} width={40} alt="file" />
              <Tooltip title={item}>
                <span className="show-tit">{item}</span>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
      {questionImageList.length > 0 && (
        <div className="upload-file-list">
          {questionImageList.map((item, index) => (
            <div key={index} className="file-item">
              <span
                className="del-file text-red-5 cursor-pointer"
                onClick={() => removeImage(index)}
              >
                ✕
              </span>
              <Image src={questionImages[index]} width={40} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
