import process from 'node:process'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createTestServer } from './common_tools.mjs'

const server = createTestServer({
  name: 'aikb-custom-stdio-test',
  transport: 'stdio',
})

const transport = new StdioServerTransport()

async function shutdown(exitCode = 0) {
  await Promise.allSettled([server.close(), transport.close()])
  process.exit(exitCode)
}

process.on('SIGINT', () => {
  void shutdown(0)
})

process.on('SIGTERM', () => {
  void shutdown(0)
})

try {
  await server.connect(transport)
  console.error('[mcp] stdio test server is ready')
} catch (error) {
  console.error('[mcp] failed to start stdio test server', error)
  await shutdown(1)
}