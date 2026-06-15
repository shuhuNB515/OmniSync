<template>
  <div class="app">
    <header class="app-header">
      <h1>OmniSync</h1>
      <span class="subtitle">多平台内容发布工具 — 一次编辑，多端适配，一键发布</span>
    </header>

    <main class="main-layout">
      <!-- 左侧：设置 + 内容编辑 + 预览 -->
      <div class="main-content">
        <!-- 发布设置（紧凑2x2网格） -->
        <SettingsPanel @settingsChange="handleSettingsChange" />

        <!-- 内容编辑 -->
        <ContentEditor
          :rawContent="rawContent"
          :tagInput="tagInput"
          :canPreview="canPreview"
          @addTag="addTag"
          @removeTag="removeTag"
          @addImage="addImage"
          @removeImage="removeImage"
          @preview="handlePreview"
          @resetAll="resetAll"
          @update:tagInput="tagInput = $event"
        />

        <!-- 适配预览 -->
        <PreviewPanel :previews="previews" />
      </div>

      <!-- 右侧：发布面板 -->
      <div class="side-panel">
        <PublishPanel
          :results="publishResults"
          :selectedPlatforms="selectedPlatforms"
          :isPublishing="isPublishing"
          :canPublish="canPublish"
          @publish="handlePublish"
          @update:selectedPlatforms="selectedPlatforms = $event"
          @recall="handleRecall"
          @recallAll="handleRecallAll"
          @edit="handleEdit"
        />
      </div>

      <!-- 返回顶部按钮 -->
      <button
        class="back-to-top"
        :class="{ visible: showBackTop }"
        @click="scrollToTop"
        title="返回顶部"
      >
        ↑
      </button>
    </main>

    <footer class="app-footer">
      <span>OmniSync — 策略模式驱动，扩展新平台只需新增适配器</span>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Platform, type RawContent, type AdaptedContent, type PublishResult } from './types'
import { previewContent, publishContent, recallPublish, editAndRepublish } from './api'
import ContentEditor from './components/ContentEditor.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import PublishPanel from './components/PublishPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'

/** 内置平台列表（不再依赖后端API加载） */
const BUILTIN_PLATFORMS = [
  { id: Platform.WECHAT, name: '公众号', icon: '📱', color: '#07c160' },
  { id: Platform.ZHIHU, name: '知乎', icon: '💬', color: '#0084ff' },
  { id: Platform.BILIBILI, name: 'B站', icon: '📺', color: '#00a1d6' },
  { id: Platform.XIAOHONGSHU, name: '小红书', icon: '📕', color: '#ff2442' },
]

export default defineComponent({
  name: 'App',
  components: { ContentEditor, PreviewPanel, PublishPanel, SettingsPanel },

  setup() {
    const selectedPlatforms = ref<Platform[]>([])
    const isPublishing = ref(false)
    const liveMode = ref(false)

    const rawContent = reactive<RawContent>({
      title: '',
      content: '',
      images: [],
      videoUrl: '',
      tags: [],
      coverUrl: '',
    })

    const tagInput = ref('')
    const previews = ref<AdaptedContent[]>([])
    const publishResults = ref<PublishResult[]>([])
    const showBackTop = ref(false)

    const canPreview = computed(() =>
      selectedPlatforms.value.length > 0 && (rawContent.title.trim() || rawContent.content.trim())
    )

    const canPublish = computed(() =>
      selectedPlatforms.value.length > 0 && (rawContent.title.trim() || rawContent.content.trim())
    )

    const addTag = () => {
      const tag = tagInput.value.trim()
      if (tag && !rawContent.tags.includes(tag)) {
        rawContent.tags.push(tag)
      }
      tagInput.value = ''
    }

    const removeTag = (idx: number) => {
      rawContent.tags.splice(idx, 1)
    }

    const addImage = () => {
      const url = prompt('请输入图片URL:')
      if (url?.trim()) {
        rawContent.images.push(url.trim())
      }
    }

    const removeImage = (idx: number) => {
      rawContent.images.splice(idx, 1)
    }

    const handlePreview = async () => {
      if (!canPreview.value) return
      try {
        const res = await previewContent(rawContent, selectedPlatforms.value)
        previews.value = res.data
      } catch (e: any) {
        alert(`预览失败: ${e.message}`)
      }
    }

    const handlePublish = async () => {
      if (!canPublish.value || isPublishing.value) return
      isPublishing.value = true
      publishResults.value = []
      try {
        const res = await publishContent(rawContent, selectedPlatforms.value)
        publishResults.value = res.results
        previews.value = []
      } catch (e: any) {
        alert(`发布失败: ${e.message}`)
      } finally {
        isPublishing.value = false
      }
    }

    // 撤回单条发布记录
    const handleRecall = async (recordId: string) => {
      try {
        const res = await recallPublish(recordId)
        if (res.success) {
          const idx = publishResults.value.findIndex(r => r.recordId === recordId)
          if (idx !== -1) {
            publishResults.value[idx].message = '已撤回'
          }
          alert('撤回成功')
        } else {
          alert(res.message)
        }
      } catch (e: any) {
        alert(`撤回失败: ${e.message}`)
      }
    }

    // 撤回所有已发布的记录
    const handleRecallAll = async () => {
      const activeResults = publishResults.value.filter(
        r => r.success && r.recordId && r.message !== '已撤回' && r.message !== '已被新版本替换'
      )
      for (const r of activeResults) {
        if (r.recordId) {
          await handleRecall(r.recordId)
        }
      }
    }

    // 编辑后重新发布
    const handleEdit = async (result: PublishResult) => {
      if (!result.recordId) return

      const newTitle = prompt('请输入新的标题:', rawContent.title)
      if (newTitle === null) return

      const newContent = prompt('请输入新的正文:', rawContent.content)
      if (newContent === null) return

      const newRawContent: RawContent = {
        ...rawContent,
        title: newTitle || rawContent.title,
        content: newContent || rawContent.content,
      }

      try {
        isPublishing.value = true
        const res = await editAndRepublish(result.recordId, newRawContent)
        if (res.success && res.result) {
          const oldIdx = publishResults.value.findIndex(r => r.recordId === result.recordId)
          if (oldIdx !== -1) {
            publishResults.value[oldIdx].message = '已被新版本替换'
          }
          publishResults.value.push(res.result)

          rawContent.title = newRawContent.title
          rawContent.content = newRawContent.content

          alert('编辑重发成功！')
        } else {
          alert(res.message)
        }
      } catch (e: any) {
        alert(`编辑重发失败: ${e.message}`)
      } finally {
        isPublishing.value = false
      }
    }

    const handleSettingsChange = (settings: { liveMode: boolean; credentials: any }) => {
      liveMode.value = settings.liveMode
    }

    const resetAll = () => {
      rawContent.title = ''
      rawContent.content = ''
      rawContent.images = []
      rawContent.videoUrl = ''
      rawContent.tags = []
      rawContent.coverUrl = ''
      tagInput.value = ''
      previews.value = []
      publishResults.value = []
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleScroll = () => {
      showBackTop.value = window.scrollY > 300
    }

    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      selectedPlatforms,
      rawContent,
      tagInput,
      previews,
      publishResults,
      isPublishing,
      canPreview,
      canPublish,
      addTag,
      removeTag,
      addImage,
      removeImage,
      handlePreview,
      handlePublish,
      handleRecall,
      handleRecallAll,
      handleEdit,
      handleSettingsChange,
      liveMode,
      resetAll,
      showBackTop,
      scrollToTop,
    }
  },
})
</script>
