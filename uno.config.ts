import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'

export default defineConfig({
  // 预设
  presets: [
    presetUno(), // 默认工具类（类似 Tailwind）
    presetAttributify(), // 属性化模式：<div text="sm red" />
    presetIcons({
      // 图标类：<i class="i-carbon-sun" />
      scale: 1.2,
      warn: true,
      collections: {
        // 自定义图标集：i-common:fold → src/renderer/src/assets/icons/common/fold.svg
        common: FileSystemIconLoader('./src/renderer/src/assets/icons/common'),
      },
    }),
  ],
  // 自定义规则
  rules: [
    [/^fz-(\d+)$/, (match) => ({ 'font-size': `${match[1]}px` })],
    [/^fw-(\w+)$/, (match) => ({ 'font-weight': `${match[1]}` })],
    [/^c-([0-9a-fA-F]{6})$/, (match) => ({ color: `#${match[1]}` })],
    [/^w-(\d+)$/, (match) => ({ width: `${match[1]}px` })],
    [/^h-(\d+)$/, (match) => ({ height: `${match[1]}px` })],
    [/^mt-(\d+)$/, (match) => ({ 'margin-top': `${match[1]}px` })],
    [/^mr-(\d+)$/, (match) => ({ 'margin-right': `${match[1]}px` })],
    [/^mb-(\d+)$/, (match) => ({ 'margin-bottom': `${match[1]}px` })],
    [/^ml-(\d+)$/, (match) => ({ 'margin-left': `${match[1]}px` })],
    [/^pt-(\d+)$/, (match) => ({ 'padding-top': `${match[1]}px` })],
    [/^pr-(\d+)$/, (match) => ({ 'padding-right': `${match[1]}px` })],
    [/^pb-(\d+)$/, (match) => ({ 'padding-bottom': `${match[1]}px` })],
    [/^pl-(\d+)$/, (match) => ({ 'padding-left': `${match[1]}px` })],
  ],
  // 自定义快捷方式
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
  },
})
