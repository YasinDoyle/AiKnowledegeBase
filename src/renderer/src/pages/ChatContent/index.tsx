import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { Card, Collapse } from 'antd'
import useChatContentStore from '@/stores/chatContent'
import useHeaderStore from '@/stores/header'
import useChatToolsStore from '@/stores/chatTools'
import useKnowledgeStore from '@/stores/knowledge'
import { useTranslation } from 'react-i18next'
import ChooseModel from '@/pages/Header/ChooseModel'
import ChatWelcome from '@/pages/ChatWelcome'
import Question from '@/pages/Question'
import Answer from '@/pages/Answer'
import ChatTools from '@/pages/ChatTools'
import Share from '@/pages/Header/Share'
import KnowledgeStore from '@/pages/KnowledgeStore'
import { scrollMove, handleScrollCallback, handleMouseLeave } from './controller'
import { eventBus } from '@/utils/tools'
import './chatContent.scss'

const doScroll = scrollMove()

export default function ChatContent() {
  const { t } = useTranslation()
  const chatHistory = useChatContentStore((s) => s.chatHistory)
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)
  const multipleModelList = useHeaderStore((s) => s.multipleModelList)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [answerListWidth, setAnswerListWidth] = useState('100%')

  // 订阅 doScroll 事件
  useEffect(() => {
    eventBus.$on('doScroll', () => doScroll(100))
    return () => eventBus.$del('doScroll')
  }, [])

  // 监听 chat-window 宽度变化，用于多模型横向滚动区域
  useEffect(() => {
    const chatWindowDom = chatWindowRef.current
    if (!chatWindowDom) return
    const updateWidth = () => setAnswerListWidth(chatWindowDom.clientWidth + 'px')
    updateWidth()
    const observer = new ResizeObserver(() => updateWidth())
    observer.observe(chatWindowDom)
    return () => observer.disconnect()
  }, [])

  // 将 Map 转为数组以便渲染，使用稳定的索引作为 key
  const chatEntries = useMemo(() => Array.from(chatHistory.entries()), [chatHistory])

  const removeModelChoose = useCallback((index: number) => {
    const header = useHeaderStore.getState()
    const list = [...header.multipleModelList]
    list.splice(index, 1)
    header.setMultipleModelList(list)
    if (list.length === 0) {
      useChatToolsStore.getState().setCompareId('')
    }
  }, [])

  // 知识库文档预览模式
  if (activeKnowledge) {
    return <KnowledgeStore />
  }

  return (
    <>
      <div className="content-wrapper">
        {/* 多模型对话面板 */}
        {multipleModelList.length > 0 && (
          <Card className="multiple-model-list" size="small">
            <Collapse
              defaultActiveKey={['model-list']}
              items={[
                {
                  key: 'model-list',
                  label: t('多模型对话'),
                  children: multipleModelList.map((item, index) => (
                    <div key={index} className="multiple-model-item">
                      <ChooseModel
                        value={item.model}
                        supplierName={item.supplierName}
                        hasMinus
                        hasPlus={false}
                        onRemove={() => removeModelChoose(index)}
                        onChange={(model, supplier) => {
                          const header = useHeaderStore.getState()
                          const list = [...header.multipleModelList]
                          list[index] = { model, supplierName: supplier }
                          header.setMultipleModelList(list)
                        }}
                      />
                    </div>
                  )),
                },
              ]}
            />
          </Card>
        )}

        {/* 聊天窗口 */}
        <div className="chat-window" onMouseLeave={handleMouseLeave} ref={chatWindowRef}>
          <div
            id="chat-scroll-area"
            className="chat-scroll-area"
            ref={scrollRef}
            onScroll={handleScrollCallback}
          >
            <ChatWelcome />

            {chatEntries.map(([questionKey, answerInfo], entryIndex) => (
              <div key={entryIndex} style={{ width: '100%' }}>
                {/* 提问 */}
                <Question questionContent={questionKey} />

                {/* 回答：多模型对比 or 单模型 */}
                {Array.isArray(answerInfo.content) ? (
                  <div
                    className="answer-scroll-wrapper"
                    style={{ width: answerListWidth, marginBottom: 30 }}
                  >
                    <div className="answer-wrapper">
                      {(answerInfo.content as string[]).map((item, idx) => (
                        <Card key={idx} style={{ minWidth: 300, height: '100%' }}>
                          <Answer
                            questionContent={questionKey}
                            answerContent={{
                              content: item,
                              id: answerInfo.id,
                              stat: Array.isArray(answerInfo.stat)
                                ? answerInfo.stat[idx]
                                : answerInfo.stat,
                              search_result: answerInfo.search_result,
                              tools_result: answerInfo.tools_result,
                            }}
                          />
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Answer questionContent={questionKey} answerContent={answerInfo} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 对话工具栏 */}
      <ChatTools />
      {/* 分享弹窗 */}
      <Share />
    </>
  )
}
