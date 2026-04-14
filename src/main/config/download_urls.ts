/**
 * 集中管理所有外部下载地址
 *
 * 将原本散落在各处的 aingdesk.bt.cn 硬编码 URL 统一收口到此处，
 * 方便切换为 GitHub Release、官方源或自建镜像。
 */

// ─── Ollama ────────────────────────────────────────────────
/** Ollama Windows 安装包 */
export const OLLAMA_WINDOWS_URL =
  'https://github.com/ollama/ollama/releases/latest/download/OllamaSetup.exe'
/** Ollama macOS 压缩包 */
export const OLLAMA_DARWIN_URL =
  'https://github.com/ollama/ollama/releases/latest/download/Ollama-darwin.zip'

// ─── Bun（MCP npx 运行时）──────────────────────────────────
/**
 * 根据平台架构返回 Bun 的下载地址
 * 官方 GitHub Release: https://github.com/oven-sh/bun/releases
 */
export function getBunDownloadUrl(osPlatformArch: string): string {
  // osPlatformArch 格式如 "win-x64" / "darwin-arm64" / "linux-x64"
  const map: Record<string, string> = {
    'win-x64': 'https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64.zip',
    'darwin-x64': 'https://github.com/oven-sh/bun/releases/latest/download/bun-darwin-x64.zip',
    'darwin-arm64':
      'https://github.com/oven-sh/bun/releases/latest/download/bun-darwin-aarch64.zip',
    'linux-x64': 'https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip',
    'linux-arm64': 'https://github.com/oven-sh/bun/releases/latest/download/bun-linux-aarch64.zip',
  }
  return (
    map[osPlatformArch] ??
    `https://github.com/oven-sh/bun/releases/latest/download/bun-${osPlatformArch}.zip`
  )
}

// ─── uv（Python 环境管理器）────────────────────────────────
/**
 * 根据平台架构返回 uv 的下载地址
 * 官方 GitHub Release: https://github.com/astral-sh/uv/releases
 */
export function getUvDownloadUrl(osPlatformArch: string): string {
  const map: Record<string, string> = {
    'win-x64':
      'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip',
    'darwin-x64':
      'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-apple-darwin.tar.gz',
    'darwin-arm64':
      'https://github.com/astral-sh/uv/releases/latest/download/uv-aarch64-apple-darwin.tar.gz',
    'linux-x64':
      'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-unknown-linux-gnu.tar.gz',
    'linux-arm64':
      'https://github.com/astral-sh/uv/releases/latest/download/uv-aarch64-unknown-linux-gnu.tar.gz',
  }
  return (
    map[osPlatformArch] ??
    `https://github.com/astral-sh/uv/releases/latest/download/uv-${osPlatformArch}.zip`
  )
}

// ─── Poppler（PDF 图片提取工具）────────────────────────────
/**
 * 根据平台架构返回 poppler (pdfimages) 的下载地址
 *
 * Windows: 使用社区维护的 poppler-windows 构建
 * macOS/Linux: 通常通过系统包管理器安装（brew / apt），此处提供预编译包地址作为 fallback
 * 官方: https://poppler.freedesktop.org/
 */
export function getPopplerDownloadUrl(osPlatformArch: string): string {
  const map: Record<string, string> = {
    'win-x64':
      'https://github.com/oschwartz10612/poppler-windows/releases/latest/download/Release-24.08.0-0.zip',
  }
  return (
    map[osPlatformArch] ??
    `https://github.com/oschwartz10612/poppler-windows/releases/latest/download/Release-24.08.0-0.zip`
  )
}

// ─── MCP 公共服务器配置 ────────────────────────────────────
/**
 * MCP 公共服务器列表 JSON 配置
 * 可替换为项目自有 GitHub repo 的 raw 地址或 CDN
 */
export const MCP_COMMON_SERVER_CONFIG_URL =
  'https://raw.githubusercontent.com/AiKnowledgeBase/config/main/common-mcp-server.json'
