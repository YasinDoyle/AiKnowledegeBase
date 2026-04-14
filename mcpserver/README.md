# MCP 测试说明

该目录用于 AiKnowledegeBase 的 MCP 联调与回归测试，包含两种服务端接口：

- stdio：用于验证项目内通过子进程拉起 MCP Server 的路径。
- sse：用于验证项目内通过远程地址连接 MCP Server 的路径。

## 文件说明

- custom_stdio_server.mjs：本地 stdio 自定义 MCP Server。
- custom_sse_server.mjs：本地 SSE 自定义 MCP Server。
- test_client.mjs：独立 MCP 测试客户端，可分别测试 stdio 和 sse。
- common_tools.mjs：两种服务共享的 MCP 工具定义。
- project-mcp-config.example.json：与项目当前 MCP 配置格式一致的示例文件。

## 暴露的测试工具

- health-check：返回服务运行状态。
- echo-text：回显文本，可选转大写。
- sum-numbers：数字求和。
- inspect-project：读取项目内指定相对路径的文件或目录信息。

## 启动方式

### 1. 启动 stdio 服务

stdio 服务通常不需要手动启动，客户端或主项目在连接时会自动拉起：

```bash
node ./mcpserver/test_client.mjs --transport stdio
```

### 2. 启动 SSE 服务

```bash
node ./mcpserver/custom_sse_server.mjs
```

默认监听地址：

```text
http://127.0.0.1:3333/sse
```

### 3. 手动调用工具

```bash
node ./mcpserver/test_client.mjs --transport stdio --tool echo-text --arguments '{"text":"hello mcp"}'
node ./mcpserver/test_client.mjs --transport sse --url http://127.0.0.1:3333/sse --tool sum-numbers --arguments '{"values":[1,2,3,4]}'
```

PowerShell 中如果引号被自动剥离，也可以直接传对象字面量：

```powershell
node .\mcpserver\test_client.mjs --transport stdio --tool echo-text --arguments '{text:"hello mcp",uppercase:true}'
node .\mcpserver\test_client.mjs --transport sse --tool sum-numbers --arguments '{values:[1,2,3,4]}'
```

如果希望完全绕开 JSON 转义，可以改用重复的 --set 参数：

```powershell
node .\mcpserver\test_client.mjs --transport sse --tool inspect-project --set relativePath=mcpserver --set maxEntries=10
node .\mcpserver\test_client.mjs --transport stdio --tool echo-text --set text=hello-mcp --set uppercase=true
```

## 接入当前项目

1. 复制 project-mcp-config.example.json 的内容到项目运行时使用的 mcp-server.json。
2. 将 __ABSOLUTE_PROJECT_PATH__ 替换为当前项目的绝对路径。
3. 若测试 SSE 接口，先启动 custom_sse_server.mjs。
4. 在项目的 MCP 配置界面或配置文件中启用对应服务器。

## 环境变量

- MCP_TEST_PORT：SSE 服务端口，默认 3333。
- MCP_TEST_SSE_PATH：SSE 连接路径，默认 /sse。
- MCP_TEST_MESSAGE_PATH：SSE 消息提交路径，默认 /messages。