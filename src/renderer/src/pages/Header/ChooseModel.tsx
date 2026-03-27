import { useMemo } from 'react'
import { Popover, Button, Tooltip } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import useHeaderStore from '@/stores/header'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import useChatToolsStore from '@/stores/chatTools'
import ModelList from './ModelList'
import { changeCurrentModel } from './controller'
import type { MultipleModelListDto } from '@/types'

export default function ChooseModel(props: {
  value?: string
  supplierName?: string
  hasMinus?: boolean
  hasPlus?: boolean
  onRemove?: () => void
  onChange?: (model: string, supplier: string) => void
}) {
  const { hasMinus = false, hasPlus = true } = props
  const { t } = useTranslation()
  const currentModel = useHeaderStore((s) => s.currentModel)
  const multipleModelList = useHeaderStore((s) => s.multipleModelList)

  const displayModel = props.value || currentModel

  function handleChooseModel(modelName: string, supplierName: string) {
    if (props.onChange) {
      props.onChange(modelName, supplierName)
    } else {
      changeCurrentModel(modelName, supplierName)
    }
  }

  function addMultipleModel() {
    const header = useHeaderStore.getState()
    const chatTools = useChatToolsStore.getState()
    const list: MultipleModelListDto[] = [
      ...header.multipleModelList,
      { model: '', supplierName: '' },
    ]
    header.setMultipleModelList(list)
    // 生成 compare_id
    if (!chatTools.compareId) {
      chatTools.setCompareId(Date.now().toString())
    }
  }

  return (
    <div className="flex items-center gap-5px">
      <Popover
        trigger="click"
        placement="bottomLeft"
        content={<ModelList onChoose={handleChooseModel} />}
      >
        <Button className="choose-model-btn">{displayModel || t('选择模型')}</Button>
      </Popover>
      {hasPlus && (
        <Tooltip title={t('多模型对话')}>
          <Button type="text" size="small" icon={<PlusOutlined />} onClick={addMultipleModel} />
        </Tooltip>
      )}
      {hasMinus && (
        <Button type="text" size="small" danger icon={<MinusOutlined />} onClick={props.onRemove} />
      )}
    </div>
  )
}
