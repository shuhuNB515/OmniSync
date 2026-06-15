<template>
  <div class="publish-panel">
    <h3 class="section-title">🚀 发布</h3>

    <!-- 平台选择 -->
    <div class="platform-selector">
      <div class="section-subtitle">选择发布平台</div>
      <div class="platform-grid">
        <div
          v-for="p in platforms"
          :key="p.id"
          class="platform-card"
          :class="{ active: selectedPlatforms.includes(p.id) }"
          @click="togglePlatform(p.id)"
        >
          <span class="platform-icon">{{ p.icon }}</span>
          <span class="platform-name">{{ p.name }}</span>
          <span class="platform-check" v-if="selectedPlatforms.includes(p.id)">✓</span>
        </div>
      </div>
    </div>

    <!-- 发布按钮 -->
    <div class="publish-actions">
      <button
        class="btn btn-primary btn-large"
        :disabled="!canPublish || isPublishing"
        @click="$emit('publish')"
      >
        <span v-if="isPublishing" class="spinner"></span>
        {{ isPublishing ? '发布中...' : '一键发布到所选平台' }}
      </button>
      <span class="hint" v-if="selectedPlatforms.length === 0">请先选择至少一个平台</span>
      <span class="hint" v-else>将发布到 {{ selectedPlatforms.length }} 个平台</span>
    </div>

    <!-- 发布结果 -->
    <div v-if="results.length > 0" class="publish-results">
      <div class="results-header">
        <h3>发布结果</h3>
        <button
          v-if="hasSuccessResults"
          class="btn btn-small btn-outline"
          @click="$emit('recallAll')"
          title="撤回所有已发布内容"
        >
          全部撤回
        </button>
      </div>

      <div v-for="r in results" :key="r.platform" class="result-item" :class="{ success: r.success, failed: !r.success, recalled: r.message === '已撤回' || r.message === '已被新版本替换' }">
        <span class="result-icon">{{ statusIcon(r) }}</span>
        <div class="result-body">
          <span class="result-platform">{{ platformName(r.platform) }}</span>
          <span class="result-msg">{{ r.message }}</span>
          <a v-if="r.publishedUrl && r.message !== '已撤回' && r.message !== '已被新版本替换'" :href="r.publishedUrl" target="_blank" class="result-link">
            查看
          </a>
        </div>
        <span class="result-time" v-if="r.publishedAt">{{ formatTime(r.publishedAt) }}</span>

        <!-- 操作按钮：仅成功且未撤回的记录显示 -->
        <div v-if="r.success && r.recordId && r.message !== '已撤回' && r.message !== '已被新版本替换'" class="result-actions">
          <button class="btn btn-small btn-warn" @click="$emit('recall', r.recordId)" title="撤回此条发布">撤回</button>
          <button class="btn btn-small btn-info" @click="$emit('edit', r)" title="编辑后重新发布">编辑重发</button>
        </div>
      </div>
    </div>
    <!-- 发布历史 -->
    <div class="publish-history">
      <button class="btn btn-small btn-outline" @click="toggleHistory">
        {{ historyExpanded ? '收起历史' : '查看发布历史' }}
      </button>
      <div v-if="historyExpanded" class="history-list">
        <div v-if="historyList.length === 0" class="history-empty">暂无发布记录</div>
        <div v-for="h in historyList" :key="h.id" class="history-item">
          <span class="history-icon">{{ h.status === 'recalled' ? '↩️' : '✅' }}</span>
          <div class="history-body">
            <span class="history-platform">{{ platformName(h.platform) }}</span>
            <span class="history-title">{{ h.rawContent?.title || '无标题' }}</span>
          </div>
          <span class="history-time">{{ formatTime(h.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, type PropType } from 'vue'
import { Platform, type PublishResult } from '../types'
import { fetchHistory } from '../api'

const NAME_MAP: Record<string, string> = {
  [Platform.WECHAT]: '公众号',
  [Platform.ZHIHU]: '知乎',
  [Platform.BILIBILI]: 'B站',
  [Platform.XIAOHONGSHU]: '小红书',
}

/** 内置平台列表 */
const PLATFORMS = [
  { id: Platform.WECHAT, name: '公众号', icon: '📱', color: '#07c160' },
  { id: Platform.ZHIHU, name: '知乎', icon: '💬', color: '#0084ff' },
  { id: Platform.BILIBILI, name: 'B站', icon: '📺', color: '#00a1d6' },
  { id: Platform.XIAOHONGSHU, name: '小红书', icon: '📕', color: '#ff2442' },
]

export default defineComponent({
  name: 'PublishPanel',
  props: {
    results: { type: Array as PropType<PublishResult[]>, required: true },
    selectedPlatforms: { type: Array as PropType<Platform[]>, required: true },
    isPublishing: { type: Boolean, default: false },
    canPublish: { type: Boolean, default: false },
  },
  emits: ['publish', 'recall', 'recallAll', 'edit', 'update:selectedPlatforms'],
  setup(props, { emit }) {
    const platforms = PLATFORMS
    const historyExpanded = ref(false)
    const historyList = ref<any[]>([])

    const platformName = (p: Platform) => NAME_MAP[p] || p

    const togglePlatform = (id: Platform) => {
      const current = [...props.selectedPlatforms]
      const idx = current.indexOf(id)
      if (idx === -1) {
        current.push(id)
      } else {
        current.splice(idx, 1)
      }
      emit('update:selectedPlatforms', current)
    }

    const toggleHistory = async () => {
      historyExpanded.value = !historyExpanded.value
      if (historyExpanded.value) {
        try {
          const res = await fetchHistory()
          historyList.value = res.data || []
        } catch {
          historyList.value = []
        }
      }
    }

    const hasSuccessResults = computed(() =>
      props.results.some(
        r => r.success && r.recordId &&
        r.message !== '已撤回' && r.message !== '已被新版本替换'
      )
    )

    const statusIcon = (r: PublishResult): string => {
      if (r.message === '已撤回') return '↩️'
      if (r.message === '已被新版本替换') return '🔄'
      if (!r.success) return '❌'
      return '✅'
    }

    const formatTime = (iso: string) => {
      const d = new Date(iso)
      return d.toLocaleString('zh-CN')
    }
    return { platforms, platformName, formatTime, hasSuccessResults, statusIcon, togglePlatform, historyExpanded, historyList, toggleHistory }
  },
})
</script>

<style scoped>
.publish-panel {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* 平台选择器 */
.platform-selector {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #a8f0c8;
  margin-bottom: 4px;
}

.platform-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.platform-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.platform-card:hover {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(0, 0, 0, 0.45);
  transform: translateY(-2px);
}

.platform-card.active {
  border-color: rgba(34, 197, 94, 0.7);
  background: rgba(34, 197, 94, 0.15);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
}

.platform-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.platform-name {
  font-weight: 700;
  font-size: 19px;
  color: #b8ffd8;
  flex: 1;
}

.platform-check {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 20px;
  color: #4ade80;
  font-weight: 900;
}

/* 发布按钮区域 */
.publish-actions {
  text-align: center;
  margin-bottom: 8px;
}

.publish-actions .hint {
  display: block;
  font-size: 17px;
  color: rgba(100, 210, 135, 0.5);
  margin-top: 10px;
}

/* 发布结果 */
.publish-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
}

.results-header h3 {
  font-size: 20px;
  color: #a8f0cc;
  margin: 0;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  transition: all 0.2s ease;
}

.result-item.success {
  background: rgba(0, 60, 30, 0.5);
  border-color: rgba(34, 197, 94, 0.3);
}

.result-item.failed {
  background: rgba(60, 0, 0, 0.45);
  border-color: rgba(220, 38, 38, 0.25);
}

.result-item.recalled {
  background: rgba(60, 55, 30, 0.45);
  border-color: rgba(160, 140, 60, 0.3);
  opacity: 0.75;
}

.result-item:hover {
  transform: translateX(4px);
}

.result-icon {
  font-size: 26px;
  flex-shrink: 0;
  line-height: 1;
}

.result-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-platform {
  font-weight: 700;
  font-size: 18px;
  color: #c8ffe8;
}

.result-msg {
  font-size: 17px;
  color: #98e8bc;
  line-height: 1.5;
}

.result-link {
  font-size: 16px;
  color: rgba(74, 222, 128, 0.85);
  text-decoration: none;
  margin-top: 4px;
  font-weight: 500;
}

.result-link:hover {
  text-decoration: underline;
  color: #86efac;
}

.result-time {
  font-size: 15px;
  color: rgba(100, 210, 135, 0.45);
  flex-shrink: 0;
}

/* 操作按钮 */
.result-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.btn-small {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-warn {
  background: rgba(200, 120, 30, 0.4);
  border-color: rgba(240, 160, 50, 0.45);
  color: #f5d080;
}

.btn-warn:hover {
  background: rgba(220, 140, 40, 0.55);
  transform: translateY(-1px);
}

.btn-info {
  background: rgba(30, 120, 180, 0.38);
  border-color: rgba(50, 150, 210, 0.42);
  color: #90dcf8;
}

.btn-info:hover {
  background: rgba(40, 140, 200, 0.52);
  transform: translateY(-1px);
}

/* 发布历史 */
.publish-history {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.history-empty {
  font-size: 14px;
  color: rgba(160, 210, 180, 0.5);
  text-align: center;
  padding: 16px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.history-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.history-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.history-platform {
  font-size: 14px;
  font-weight: 600;
  color: #a0e8c0;
}

.history-title {
  font-size: 13px;
  color: rgba(160, 210, 180, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 12px;
  color: rgba(140, 190, 160, 0.4);
  flex-shrink: 0;
}
</style>
