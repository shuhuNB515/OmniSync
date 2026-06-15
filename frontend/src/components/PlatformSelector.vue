<template>
  <div class="platform-selector">
    <h3 class="section-title">📋 选择发布平台</h3>
    <div class="platform-grid">
      <label
        v-for="p in platforms"
        :key="p.id"
        class="platform-card"
        :class="{ active: isSelected(p.id) }"
      >
        <input
          type="checkbox"
          :checked="isSelected(p.id)"
          @change="togglePlatform(p.id)"
          class="platform-checkbox"
        />
        <span class="platform-icon">{{ getIcon(p.id) }}</span>
        <span class="platform-name">{{ p.name }}</span>
        <span class="platform-tips">{{ p.formatTips.slice(0, 20) }}...</span>
        <span class="platform-limits">
          标题≤{{ p.maxTitleLength }}字 | 正文≤{{ p.maxContentLength }}字
        </span>
      </label>
    </div>
    <div v-if="platforms.length === 0" class="empty-hint">加载平台信息中...</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { Platform, type PlatformMeta } from '../types'

const ICON_MAP: Record<string, string> = {
  [Platform.WECHAT]: '🟢',
  [Platform.ZHIHU]: '🔵',
  [Platform.BILIBILI]: '🩷',
  [Platform.XIAOHONGSHU]: '🔴',
}

export default defineComponent({
  name: 'PlatformSelector',
  props: {
    platforms: { type: Array as PropType<PlatformMeta[]>, required: true },
    selected: { type: Array as PropType<Platform[]>, required: true },
  },
  emits: ['update:selected'],
  setup(props, { emit }) {
    const isSelected = (id: Platform) => props.selected.includes(id)

    const togglePlatform = (id: Platform) => {
      const updated = isSelected(id)
        ? props.selected.filter(s => s !== id)
        : [...props.selected, id]
      emit('update:selected', updated)
    }

    const getIcon = (id: Platform) => ICON_MAP[id] || '📄'

    return { isSelected, togglePlatform, getIcon }
  },
})
</script>
