import process from 'node:process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { defaultSseUrl, defaultStdioServerPath } from './common_tools.mjs'

function parseArgs(argv) {
  const options = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current.startsWith('--')) {
      continue
    }

    const key = current.slice(2)
    const value = argv[index + 1]

    if (!value || value.startsWith('--')) {
      options[key] = 'true'
      continue
    }

    if (options[key] === undefined) {
      options[key] = value
    } else if (Array.isArray(options[key])) {
      options[key].push(value)
    } else {
      options[key] = [options[key], value]
    }

    index += 1
  }

  return options
}

function parseScalarValue(rawValue) {
  if (rawValue === 'true') {
    return true
  }

  if (rawValue === 'false') {
    return false
  }

  if (rawValue === 'null') {
    return null
  }

  if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) {
    return Number(rawValue)
  }

  if (
    (rawValue.startsWith('{') && rawValue.endsWith('}')) ||
    (rawValue.startsWith('[') && rawValue.endsWith(']'))
  ) {
    return parseJsonValue(rawValue, rawValue)
  }

  return rawValue
}

function parseSetArguments(rawValue) {
  if (!rawValue) {
    return {}
  }

  const pairs = Array.isArray(rawValue) ? rawValue : [rawValue]
  const result = {}

  for (const pair of pairs) {
    const separatorIndex = pair.indexOf('=')
    if (separatorIndex === -1) {
      throw new Error(`Invalid --set value: ${pair}`)
    }

    const key = pair.slice(0, separatorIndex).trim()
    const value = pair.slice(separatorIndex + 1).trim()

    if (!key) {
      throw new Error(`Invalid --set key: ${pair}`)
    }

    result[key] = parseScalarValue(value)
  }

  return result
}

function parseJsonValue(rawValue, fallbackValue) {
  if (!rawValue) {
    return fallbackValue
  }

  try {
    return JSON.parse(rawValue)
  } catch (error) {
    try {
      return Function(`"use strict"; return (${rawValue})`)()
    } catch {
      throw new Error(`Invalid JSON value: ${rawValue}\n${error}`)
    }
  }
}

async function createTransport(options) {
  const transportType = options.transport || 'stdio'

  if (transportType === 'sse') {
    return {
      transportType,
      transport: new SSEClientTransport(new URL(options.url || defaultSseUrl)),
    }
  }

  if (transportType === 'stdio') {
    const command = options.command || process.execPath
    const args = parseJsonValue(options.args, [defaultStdioServerPath])
    return {
      transportType,
      transport: new StdioClientTransport({
        command,
        args,
        env: process.env,
      }),
    }
  }

  throw new Error(`Unsupported transport type: ${transportType}`)
}

function printUsage() {
  console.log(
    'Usage: node ./mcpserver/test_client.mjs --transport stdio|sse [--tool TOOL_NAME] [--arguments JSON]',
  )
  console.log(
    'Alternative: node ./mcpserver/test_client.mjs --transport stdio|sse --tool TOOL_NAME --set key=value --set key=value',
  )
  console.log('Examples:')
  console.log('  node ./mcpserver/test_client.mjs --transport stdio')
  console.log(
    '  node ./mcpserver/test_client.mjs --transport stdio --tool echo-text --arguments {"text":"hello"}',
  )
  console.log(
    '  node ./mcpserver/test_client.mjs --transport sse --url http://127.0.0.1:3333/sse --tool sum-numbers --arguments {"values":[1,2,3]}',
  )
  console.log(
    '  node ./mcpserver/test_client.mjs --transport sse --tool inspect-project --set relativePath=mcpserver --set maxEntries=10',
  )
}

const options = parseArgs(process.argv.slice(2))

if (options.help === 'true') {
  printUsage()
  process.exit(0)
}

const client = new Client(
  {
    name: 'aikb-mcp-test-client',
    version: '1.0.0',
  },
  {
    capabilities: {},
  },
)

const { transportType, transport } = await createTransport(options)

try {
  await client.connect(transport)
  console.log(`[mcp-test] connected by ${transportType}`)

  // ── Tools ──────────────────────────────────────────────
  const toolList = await client.listTools()
  console.log('[mcp-test] available tools:')
  for (const t of toolList.tools) {
    console.log(`  - ${t.name}: ${t.description}`)
  }

  // ── Resources ──────────────────────────────────────────
  try {
    const resourceList = await client.listResources()
    console.log('[mcp-test] available resources:')
    for (const r of resourceList.resources) {
      console.log(`  - ${r.name} (${r.uri}): ${r.description || ''}`)
    }
  } catch {
    console.log('[mcp-test] resources not supported by this server')
  }

  try {
    const templateList = await client.listResourceTemplates()
    if (templateList.resourceTemplates.length > 0) {
      console.log('[mcp-test] resource templates:')
      for (const t of templateList.resourceTemplates) {
        console.log(`  - ${t.name} (${t.uriTemplate}): ${t.description || ''}`)
      }
    }
  } catch {
    /* not supported */
  }

  // ── Prompts ────────────────────────────────────────────
  try {
    const promptList = await client.listPrompts()
    console.log('[mcp-test] available prompts:')
    for (const p of promptList.prompts) {
      console.log(`  - ${p.name}: ${p.description || ''}`)
    }
  } catch {
    console.log('[mcp-test] prompts not supported by this server')
  }

  // ── Execute requested action ──────────────────────────
  const actionArgs = options.arguments
    ? parseJsonValue(options.arguments, {})
    : parseSetArguments(options.set)

  if (options.tool) {
    const result = await client.callTool({
      name: options.tool,
      arguments: actionArgs,
    })
    console.log(`[mcp-test] tool result for ${options.tool}:`)
    console.log(JSON.stringify(result, null, 2))
  }

  if (options.resource) {
    const result = await client.readResource({ uri: options.resource })
    console.log(`[mcp-test] resource result for ${options.resource}:`)
    console.log(JSON.stringify(result, null, 2))
  }

  if (options.prompt) {
    const result = await client.getPrompt({ name: options.prompt, arguments: actionArgs })
    console.log(`[mcp-test] prompt result for ${options.prompt}:`)
    console.log(JSON.stringify(result, null, 2))
  }
} catch (error) {
  console.error('[mcp-test] execution failed', error)
  process.exitCode = 1
} finally {
  await transport.close()
}
