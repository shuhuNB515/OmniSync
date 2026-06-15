<template>
  <div class="content-editor">
    <h3 class="section-title">📝 内容编辑</h3>

    <!-- 标题 -->
    <div class="form-group">
      <label>标题</label>
      <input
        v-model="rawContent.title"
        type="text"
        placeholder="输入文章标题..."
        maxlength="100"
      />
      <span class="char-count">{{ rawContent.title.length }}/100</span>
    </div>

    <!-- 正文 (Markdown) -->
    <div class="form-group">
      <label>正文（支持 Markdown）</label>
      <textarea
        v-model="rawContent.content"
        placeholder="在此输入正文，支持 Markdown 格式..."
        rows="10"
      ></textarea>
      <span class="char-count">{{ rawContent.content.length }} 字</span>
    </div>

    <!-- 图片 -->
    <div class="form-group">
      <label>图片</label>
      <div class="image-list">
        <div v-for="(img, idx) in rawContent.images" :key="idx" class="image-item">
          <span class="image-url">{{ img }}</span>
          <button class="btn-sm btn-danger" @click="$emit('removeImage', idx)">×</button>
        </div>
        <button class="btn-sm btn-outline" @click="$emit('addImage')">+ 添加图片URL</button>
      </div>
    </div>

    <!-- 视频链接 -->
    <div class="form-group">
      <label>视频链接（可选）</label>
      <input
        v-model="rawContent.videoUrl"
        type="text"
        placeholder="输入视频URL..."
      />
    </div>

    <!-- 封面 -->
    <div class="form-group">
      <label>封面图URL（可选）</label>
      <input
        v-model="rawContent.coverUrl"
        type="text"
        placeholder="输入封面图URL..."
      />
    </div>

    <!-- 标签 -->
    <div class="form-group">
      <label>标签</label>
      <div class="tag-input-row">
        <input
          :value="tagInput"
          @input="$emit('update:tagInput', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="输入标签后按回车"
          @keyup.enter="$emit('addTag')"
        />
        <button class="btn-sm btn-primary" @click="$emit('addTag')">添加</button>
      </div>
      <div class="tag-list" v-if="rawContent.tags.length">
        <span v-for="(tag, idx) in rawContent.tags" :key="idx" class="tag">
          #{{ tag }}
          <button class="tag-remove" @click="$emit('removeTag', idx)">×</button>
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="editor-actions">
      <button class="btn btn-outline" @click="$emit('resetAll')">重置</button>
      <button
        class="btn btn-secondary"
        :disabled="!canPreview"
        @click="$emit('preview')"
      >
        🔍 预览适配效果
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ContentEditor',
  props: {
    rawContent: { type: Object, required: true },
    tagInput: { type: String, default: '' },
    canPreview: { type: Boolean, default: false },
  },
  emits: ['addTag', 'removeTag', 'addImage', 'removeImage', 'preview', 'resetAll', 'update:tagInput'],
})
</script>
