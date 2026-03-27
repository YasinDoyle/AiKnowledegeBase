import { useEffect, useRef, useMemo } from 'react'
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
import MarkdownRender from '@/pages/Answer/MarkdownRender'
import { scrollMove, handleScrollCallback, handleMouseLeave } from './controller'
import { eventBus } from '@/utils/tools'
import type { AnswerInfo, MultipeQuestionDto } from '@/types'
import './chatContent.scss'

const doScroll = scrollMove()

export default function ChatContent() {
  const { t } = useTranslation()
  const chatHistory = useChatContentStore((s) => s.chatHistory)
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)
  const multipleModelList = useHeaderStore((s) => s.multipleModelList)
  const compareId = useChatToolsStore((s) => s.compareId)
  const chatWindowRef = useRef<HTMLDivElement>(null)

  // 订阅 doScroll 事件
  useEffect(() => {
    eventBus.$on('doScroll', () => doScroll(100))
    return () => eventBus.$del('doScroll')
  }, [])

  // 将 Map 转为数组以便渲染
  const chatEntries = useMemo(() => Array.from(chatHistory.entries()), [chatHistory])

  function removeModelChoose(index: number) {
    const header = useHeaderStore.getState()
    const list = [...header.multipleModelList]
    list.splice(index, 1)
    header.setMultipleModelList(list)
    if (list.length === 0) {
      useChatToolsStore.getState().setCompareId('')
    }
  }

  // 知识库文档预览模式
  if (activeKnowledge) {
    return (
      <div className="doc-content">
        <MarkdownRender content="" />
      </div>
    )
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
          <div id="chat-scroll-area" className="chat-scroll-area" onScroll={handleScrollCallback}>
            <ChatWelcome />

            {chatEntries.map(([questionKey, chatContent]) => (
              <div key={questionKey.content} style={{ width: '100%' }}>
                <Question questionContent={questionKey} />

                {Array.isArray(chatContent.content) ? (
                  <div className="answer-wrapper" style={{ marginBottom: 30 }}>
                    {(chatContent.content as string[]).map((item, idx) => (
                      <Card key={idx} style={{ minWidth: 300, height: '100%' }}>
                        <Answer
                          questionContent={questionKey}
                          answerContent={{
                            content: item,
                            id: chatContent.id,
                            stat: Array.isArray(chatContent.stat)
                              ? chatContent.stat[idx]
                              : chatContent.stat,
                            search_result: chatContent.search_result,
                            tools_result: chatContent.tools_result,
                          }}
                        />
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Answer questionContent={questionKey} answerContent={chatContent} />
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
