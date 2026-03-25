import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  // 预设
  presets: [
    presetUno(), // 默认工具类（类似 Tailwind）
    presetAttributify(), // 属性化模式：<div text="sm red" />
    presetIcons({
      // 图标类：<i class="i-carbon-sun" />
      scale: 1.2,
      warn: true,
    }),
  ],
  // 自定义快捷方式
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
  },
})
