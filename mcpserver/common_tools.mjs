import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as z from 'zod/v4'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(currentDir, '..')

function textResult(text) {
  return {
    content: [{ type: 'text', text }],
  }
}

export function createTestServer({ name, transport }) {
  const server = new McpServer(
    {
      name,
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
        resources: {},
        prompts: {},
      },
    },
  )

  server.registerTool(
    'health-check',
    {
      description: 'Return the current server runtime status for smoke testing.',
      inputSchema: {},
    },
    async () => {
      return textResult(
        JSON.stringify(
          {
            ok: true,
            server: name,
            transport,
            pid: process.pid,
            cwd: process.cwd(),
            workspaceRoot,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      )
    },
  )

  server.registerTool(
    'echo-text',
    {
      description: 'Echo input text and attach basic metadata.',
      inputSchema: {
        text: z.string().min(1).describe('Text content to echo.'),
        uppercase: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether to uppercase the output.'),
      },
    },
    async ({ text, uppercase }) => {
      const value = uppercase ? text.toUpperCase() : text
      return textResult(
        JSON.stringify(
          {
            original: text,
            output: value,
            length: value.length,
          },
          null,
          2,
        ),
      )
    },
  )

  server.registerTool(
    'sum-numbers',
    {
      description: 'Sum a numeric array for tool invocation testing.',
      inputSchema: {
        values: z.array(z.number()).min(1).describe('Numeric array to sum.'),
      },
    },
    async ({ values }) => {
      const sum = values.reduce((total, current) => total + current, 0)
      return textResult(
        JSON.stringify(
          {
            values,
            count: values.length,
            sum,
          },
          null,
          2,
        ),
      )
    },
  )

  server.registerTool(
    'inspect-project',
    {
      description: 'Inspect files under the current workspace for MCP integration testing.',
      inputSchema: {
        relativePath: z
          .string()
          .optional()
          .default('.')
          .describe('Path relative to the project root.'),
        maxEntries: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .default(20)
          .describe('Max entries to return.'),
      },
    },
    async ({ relativePath, maxEntries }) => {
      const targetPath = path.resolve(workspaceRoot, relativePath)
      const stat = await fs.stat(targetPath)

      if (stat.isFile()) {
        return textResult(
          JSON.stringify(
            {
              type: 'file',
              relativePath,
              size: stat.size,
              modifiedAt: stat.mtime.toISOString(),
            },
            null,
            2,
          ),
        )
      }

      const entries = await fs.readdir(targetPath, { withFileTypes: true })
      const output = entries.slice(0, maxEntries).map((entry) => ({
        name: entry.name,
        kind: entry.isDirectory() ? 'directory' : 'file',
      }))

      return textResult(
        JSON.stringify(
          {
            type: 'directory',
            relativePath,
            totalEntries: entries.length,
            returnedEntries: output,
          },
          null,
          2,
        ),
      )
    },
  )

  // ─── Resources ────────────────────────────────────────────

  // 静态资源：服务器信息
  server.registerResource(
    'server-info',
    'mcp://test/server-info',
    {
      description: 'Static resource: current MCP test server metadata.',
      mimeType: 'application/json',
    },
    async () => {
      return {
        contents: [
          {
            uri: 'mcp://test/server-info',
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                name,
                transport,
                version: '1.0.0',
                pid: process.pid,
                workspaceRoot,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  // 动态资源模板：读取项目文件内容
  server.registerResource(
    'project-file',
    new ResourceTemplate('mcp://test/file/{filePath}', { list: undefined }),
    {
      description: 'Dynamic resource template: read a project file by relative path.',
      mimeType: 'text/plain',
    },
    async (uri, variables) => {
      const filePath = variables.filePath
      const absolutePath = path.resolve(workspaceRoot, filePath)
      const content = await fs.readFile(absolutePath, 'utf-8')
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: content,
          },
        ],
      }
    },
  )

  // ─── Prompts ─────────────────────────────────────────────

  // 无参数的简单 prompt
  server.registerPrompt(
    'code-review',
    {
      description: 'Prompt template: request a code review for given code.',
      argsSchema: {
        code: z.string().describe('The code snippet to review.'),
        language: z.string().optional().default('typescript').describe('Programming language.'),
      },
    },
    async ({ code, language }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review the following ${language} code and provide feedback:\n\n\`\`\`${language}\n${code}\n\`\`\``,
            },
          },
        ],
      }
    },
  )

  // 带参数的翻译 prompt
  server.registerPrompt(
    'translate',
    {
      description: 'Prompt template: translate text between languages.',
      argsSchema: {
        text: z.string().describe('Text to translate.'),
        from: z.string().optional().default('en').describe('Source language.'),
        to: z.string().optional().default('zh').describe('Target language.'),
      },
    },
    async ({ text, from, to }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Translate the following text from ${from} to ${to}:\n\n${text}`,
            },
          },
        ],
      }
    },
  )

  return server
}

export const defaultStdioServerPath = path.resolve(currentDir, 'custom_stdio_server.mjs')
export const defaultSseUrl = 'http://127.0.0.1:3333/sse'
