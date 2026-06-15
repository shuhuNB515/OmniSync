<template>
  <div class="preview-panel" v-if="previews.length > 0">
    <h3 class="section-title">👁️ 适配预览</h3>
    <div class="preview-tabs">
      <button
        v-for="p in previews"
        :key="p.platform"
        class="tab-btn"
        :class="{ active: activeTab === p.platform }"
        @click="activeTab = p.platform"
      >
        {{ platformName(p.platform) }}
      </button>
    </div>

    <div v-for="p in previews" :key="p.platform" class="preview-content" v-show="activeTab === p.platform">
      <div class="preview-field">
        <label>标题 ({{ p.title.length }}字)</label>
        <div class="preview-value title-preview">{{ p.title }}</div>
      </div>

      <div class="preview-field">
        <label>正文 ({{ p.content.length }}字)</label>
        <div class="preview-value content-preview">{{ p.content }}</div>
      </div>

      <div class="preview-field" v-if="p.images.length">
        <label>图片 ({{ p.images.length }}张)</label>
        <div class="preview-images">
          <span v-for="(img, i) in p.images" :key="i" class="preview-img-tag">🖼️ {{ img.slice(0, 30) }}...</span>
        </div>
      </div>

      <div class="preview-field" v-if="p.videoUrl">
        <label>视频</label>
        <span>🎬 {{ p.videoUrl }}</span>
      </div>

      <div class="preview-field" v-if="p.tags.length">
        <label>标签</label>
        <div class="preview-tags">
          <span v-for="t in p.tags" :key="t" class="tag">#{{ t }}</span>
        </div>
      </div>

      <div class="preview-field" v-if="p.coverUrl">
        <label>封面</label>
        <span>{{ p.coverUrl }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue'
import { Platform, type AdaptedContent } from '../types'

const NAME_MAP: Record<string, string> = {
  [Platform.WECHAT]: '公众号',
  [Platform.ZHIHU]: '知乎',
  [Platform.BILIBILI]: 'B站',
  [Platform.XIAOHONGSHU]: '小红书',
}

export default defineComponent({
  name: 'PreviewPanel',
  props: {
    previews: { type: Array as PropType<AdaptedContent[]>, required: true },
  },
  setup(props) {
    const activeTab = ref(props.previews[0]?.platform || Platform.WECHAT)
    const platformName = (p: Platform) => NAME_MAP[p] || p
    return { activeTab, platformName }
  },
})
</script>
