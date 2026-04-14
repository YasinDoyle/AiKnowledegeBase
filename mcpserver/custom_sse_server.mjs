import process from 'node:process'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createTestServer } from './common_tools.mjs'

const port = Number(process.env.MCP_TEST_PORT || 3333)
const ssePath = process.env.MCP_TEST_SSE_PATH || '/sse'
const messagePath = process.env.MCP_TEST_MESSAGE_PATH || '/messages'

const app = createMcpExpressApp()
const sessions = new Map()

app.get(ssePath, async (_req, res) => {
  const transport = new SSEServerTransport(messagePath, res)
  const server = createTestServer({
    name: 'aikb-custom-sse-test',
    transport: 'sse',
  })

  transport.onclose = () => {
    sessions.delete(transport.sessionId)
  }

  try {
    await server.connect(transport)
    sessions.set(transport.sessionId, { server, transport })
    console.log(`[mcp] SSE session connected: ${transport.sessionId}`)
  } catch (error) {
    console.error('[mcp] failed to establish SSE session', error)
    if (!res.headersSent) {
      res.status(500).send('Failed to establish SSE session')
    }
    await Promise.allSettled([server.close(), transport.close()])
  }
})

app.post(messagePath, async (req, res) => {
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : ''

  if (!sessionId) {
    res.status(400).send('Missing sessionId query parameter')
    return
  }

  const session = sessions.get(sessionId)
  if (!session) {
    res.status(404).send('Session not found')
    return
  }

  try {
    await session.transport.handlePostMessage(req, res, req.body)
  } catch (error) {
    console.error(`[mcp] failed to handle SSE POST for session ${sessionId}`, error)
    if (!res.headersSent) {
      res.status(500).send('Failed to handle MCP request')
    }
  }
})

const serverInstance = app.listen(port, '127.0.0.1', () => {
  console.log(`[mcp] custom SSE test server listening at http://127.0.0.1:${port}${ssePath}`)
})

async function shutdown(exitCode = 0) {
  serverInstance.close()
  await Promise.allSettled(Array.from(sessions.values()).map((session) => session.server.close()))
  sessions.clear()
  process.exit(exitCode)
}

process.on('SIGINT', () => {
  void shutdown(0)
})

process.on('SIGTERM', () => {
  void shutdown(0)
})