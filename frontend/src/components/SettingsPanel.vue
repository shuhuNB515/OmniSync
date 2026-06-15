<template>
  <div class="settings-panel">
    <!-- 标题行：模式切换 + 展开/收起 -->
    <div class="settings-header">
      <div class="header-left">
        <h3 class="section-title" style="margin-bottom:0;border:none;padding:0">⚙️ 发布设置</h3>
        <div class="mode-toggle">
          <button
            class="mode-chip"
            :class="{ active: !settings.liveMode }"
            @click="toggleMode(false)"
          >🧪 模拟</button>
          <button
            class="mode-chip"
            :class="{ active: settings.liveMode }"
            @click="toggleMode(true)"
          >🔗 真实</button>
        </div>
      </div>
      <button v-if="settings.liveMode" class="toggle-btn" @click="expanded = !expanded">
        {{ expanded ? '收起 ▲' : '展开 ▼' }}
      </button>
    </div>

    <!-- 模拟模式提示 -->
    <div v-if="!settings.liveMode" class="mock-hint">
      当前模拟模式，发布结果均为模拟数据。切换「真实」需配置平台凭证。
    </div>

    <!-- 2x2 平台卡片网格 -->
    <div v-if="settings.liveMode" class="platform-grid">
      <!-- 公众号 -->
      <div class="platform-tile" :class="{ configured: hasWechatCreds }" @click="toggleExpand('wechat')">
        <div class="tile-top">
          <span class="tile-icon">📱</span>
          <span class="tile-name">公众号</span>
          <span class="tile-status">{{ hasWechatCreds ? '✅' : '⚠️' }}</span>
        </div>
        <div class="tile-desc">{{ hasWechatCreds ? '已配置' : '未配置' }}</div>
      </div>

      <!-- 知乎 -->
      <div class="platform-tile" :class="{ configured: !!credentials.zhihu.accessToken }" @click="toggleExpand('zhihu')">
        <div class="tile-top">
          <span class="tile-icon">💬</span>
          <span class="tile-name">知乎</span>
          <span class="tile-status">{{ credentials.zhihu.accessToken ? '✅' : '⚠️' }}</span>
        </div>
        <div class="tile-desc">{{ credentials.zhihu.accessToken ? '已配置' : '未配置' }}</div>
      </div>

      <!-- B站 -->
      <div class="platform-tile" :class="{ configured: hasBilibiliCreds }" @click="toggleExpand('bilibili')">
        <div class="tile-top">
          <span class="tile-icon">📺</span>
          <span class="tile-name">B站</span>
          <span class="tile-status">{{ hasBilibiliCreds ? '✅' : '⚠️' }}</span>
        </div>
        <div class="tile-desc">{{ hasBilibiliCreds ? '已配置' : '未配置' }}</div>
      </div>

      <!-- 小红书 -->
      <div class="platform-tile" :class="{ configured: !!credentials.xiaohongshu.accessToken }" @click="toggleExpand('xiaohongshu')">
        <div class="tile-top">
          <span class="tile-icon">📕</span>
          <span class="tile-name">小红书</span>
          <span class="tile-status">{{ credentials.xiaohongshu.accessToken ? '✅' : '⚠️' }}</span>
        </div>
        <div class="tile-desc">{{ credentials.xiaohongshu.accessToken ? '已配置' : '未配置' }}</div>
      </div>
    </div>

    <!-- 展开的凭证详情 -->
    <div v-if="settings.liveMode && expanded" class="cred-details">
      <!-- 公众号详情 -->
      <div v-if="activePlatform === 'wechat'" class="cred-detail-card">
        <div class="detail-header">
          <span>📱 公众号凭证配置</span>
          <button class="close-btn" @click.stop="activePlatform = ''">✕</button>
        </div>
        <div class="cred-guide">
          <div class="guide-title">📋 如何获取？</div>
          <ol class="guide-steps">
            <li>登录 <a href="https://mp.weixin.qq.com" target="_blank">微信公众平台</a></li>
            <li>进入「设置与开发」→「基本配置」</li>
            <li>找到 <b>AppID</b> 和 <b>AppSecret</b></li>
            <li>AppSecret 点击「重置」后只显示一次，请立即保存</li>
          </ol>
        </div>
        <div class="cred-fields">
          <div class="cred-field-item">
            <label class="cred-label">应用ID（AppID）</label>
            <input type="text" placeholder="例如：wx1234567890abcdef" v-model="credentials.wechat.appId" class="cred-input" />
            <span class="cred-hint">公众号唯一标识，在基本配置页面直接复制</span>
          </div>
          <div class="cred-field-item">
            <label class="cred-label">应用密钥（AppSecret）</label>
            <input :type="showSecrets ? 'text' : 'password'" placeholder="例如：a1b2c3d4e5f6..." v-model="credentials.wechat.appSecret" class="cred-input" />
            <span class="cred-hint">点击「重置」获取，仅显示一次</span>
          </div>
          <div class="cred-field-item">
            <label class="cred-label">访问令牌（可选）</label>
            <input :type="showSecrets ? 'text' : 'password'" placeholder="留空则自动生成" v-model="credentials.wechat.accessToken" class="cred-input" />
            <span class="cred-hint">一般留空，系统自动用AppID+Secret获取</span>
          </div>
        </div>
      </div>

      <!-- 知乎详情 -->
      <div v-if="activePlatform === 'zhihu'" class="cred-detail-card">
        <div class="detail-header">
          <span>💬 知乎凭证配置</span>
          <button class="close-btn" @click.stop="activePlatform = ''">✕</button>
        </div>
        <div class="cred-guide">
          <div class="guide-title">📋 如何获取？</div>
          <ol class="guide-steps">
            <li>访问 <a href="https://open.zhihu.com" target="_blank">知乎开放平台</a> 注册开发者</li>
            <li>创建「网页应用」并提交审核</li>
            <li>审核通过后，通过 OAuth2 授权获取 Token</li>
            <li>流程：点击授权 → 登录知乎 → 跳转回调 → 获取Token</li>
          </ol>
        </div>
        <div class="cred-fields">
          <div class="cred-field-item">
            <label class="cred-label">访问令牌（AccessToken）</label>
            <input :type="showSecrets ? 'text' : 'password'" placeholder="通过OAuth2授权获取" v-model="credentials.zhihu.accessToken" class="cred-input" />
            <span class="cred-hint">OAuth2授权获取，有效期通常30天</span>
          </div>
        </div>
      </div>

      <!-- B站详情 -->
      <div v-if="activePlatform === 'bilibili'" class="cred-detail-card">
        <div class="detail-header">
          <span>📺 B站凭证配置</span>
          <button class="close-btn" @click.stop="activePlatform = ''">✕</button>
        </div>
        <div class="cred-guide">
          <div class="guide-title">📋 如何获取？</div>
          <ol class="guide-steps">
            <li>访问 <a href="https://openhome.bilibili.com" target="_blank">B站开放平台</a></li>
            <li>创建应用，获取 <b>AppID</b> 和 <b>AppSecret</b></li>
            <li>通过 OAuth2 授权让用户授权你的应用</li>
            <li>用授权码换取 <b>AccessToken</b></li>
          </ol>
        </div>
        <div class="cred-fields">
          <div class="cred-field-item">
            <label class="cred-label">应用ID（AppID）</label>
            <input type="text" placeholder="创建应用后获得" v-model="credentials.bilibili.appId" class="cred-input" />
            <span class="cred-hint">创建应用时分配的唯一编号</span>
          </div>
          <div class="cred-field-item">
            <label class="cred-label">应用密钥（AppSecret）</label>
            <input :type="showSecrets ? 'text' : 'password'" placeholder="创建应用时分配的密钥" v-model="credentials.bilibili.appSecret" class="cred-input" />
            <span class="cred-hint">用于签名验证，请勿泄露</span>
          </div>
          <div class="cred-field-item">
            <label class="cred-label">访问令牌（AccessToken）</label>
            <input :type="showSecrets ? 'text' : 'password'" placeholder="OAuth2授权后获得" v-model="credentials.bilibili.accessToken" class="cred-input" />
            <span class="cred-hint">代表用户身份，操作B站账号</span>
          </div>
        </div>
      </div>

      <!-- 小红书详情 -->
      <div v-if="activePlatform === 'xiaohongshu'" class="cred-detail-card">
        <div class="detail-header">
          <span>📕 小红书凭证配置</span>
          <button class="close-btn" @click.stop="activePlatform = ''">✕</button>
        </div>
        <div class="cred-guide">
          <div class="guide-title">📋 如何获取？</div>
          <ol class="guide-steps">
            <li>访问 <a href="https://open.xiaohongshu.com" target="_blank">小红书开放平台</a></li>
            <li>创建应用，提交资质审核（需企业营业执照）</li>
            <li>审核通过后，通过 OAuth2 授权获取 Token</li>
            <li>注意：目前仅对企业开发者开放</li>
          </ol>
        </div>
        <div class="cred-fields">
          <div class="cred-field-item">
            <label class="cred-label">访问令牌（AccessToken）</label>
            <input :type="showSecrets ? 'text' : 'password'" placeholder="OAuth2授权获取" v-model="credentials.xiaohongshu.accessToken" class="cred-input" />
            <span class="cred-hint">用于发布笔记和视频</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="cred-actions">
        <button class="btn-sm" @click="showSecrets = !showSecrets">
          {{ showSecrets ? '🙈 隐藏密钥' : '👁 显示密钥' }}
        </button>
        <button class="btn-sm btn-primary-sm" @click="saveSettings" :disabled="saving">
          {{ saving ? '保存中...' : '💾 保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, onMounted } from 'vue'

interface PlatformCredentials {
  appId?: string
  appSecret?: string
  accessToken?: string
}

export default defineComponent({
  name: 'SettingsPanel',
  emits: ['settingsChange'],
  setup(props, { emit }) {
    const showSecrets = ref(false)
    const saving = ref(false)
    const expanded = ref(false)
    const activePlatform = ref('')

    const settings = reactive({
      liveMode: false,
    })

    const credentials = reactive({
      wechat: { appId: '', appSecret: '', accessToken: '' } as PlatformCredentials,
      zhihu: { accessToken: '' } as PlatformCredentials,
      bilibili: { appId: '', appSecret: '', accessToken: '' } as PlatformCredentials,
      xiaohongshu: { accessToken: '' } as PlatformCredentials,
    })

    const hasWechatCreds = computed(() =>
      credentials.wechat.appId && credentials.wechat.appSecret
    )

    const hasBilibiliCreds = computed(() =>
      credentials.bilibili.appId && credentials.bilibili.accessToken
    )

    const toggleExpand = (platform: string) => {
      if (activePlatform.value === platform) {
        activePlatform.value = ''
      } else {
        activePlatform.value = platform
        expanded.value = true
      }
    }

    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('omnisync_settings')
        if (saved) {
          const data = JSON.parse(saved)
          settings.liveMode = data.liveMode || false
          if (data.credentials) {
            Object.assign(credentials.wechat, data.credentials.wechat || {})
            Object.assign(credentials.zhihu, data.credentials.zhihu || {})
            Object.assign(credentials.bilibili, data.credentials.bilibili || {})
            Object.assign(credentials.xiaohongshu, data.credentials.xiaohongshu || {})
          }
        }
      } catch {}
    }

    const saveSettings = async () => {
      saving.value = true
      try {
        const data = {
          liveMode: settings.liveMode,
          credentials: JSON.parse(JSON.stringify(credentials)),
        }
        localStorage.setItem('omnisync_settings', JSON.stringify(data))

        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          if (!res.ok) throw new Error()
        } catch {}

        emit('settingsChange', data)
        alert('配置已保存！')
      } finally {
        saving.value = false
      }
    }

    const toggleMode = (live: boolean) => {
      settings.liveMode = live
      if (!live) {
        expanded.value = false
        activePlatform.value = ''
      }
      emit('settingsChange', {
        liveMode: live,
        credentials: JSON.parse(JSON.stringify(credentials)),
      })
    }

    onMounted(loadSettings)

    return {
      settings,
      credentials,
      showSecrets,
      saving,
      expanded,
      activePlatform,
      hasWechatCreds,
      hasBilibiliCreds,
      toggleExpand,
      toggleMode,
      saveSettings,
    }
  },
})
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 18px 20px;
}

/* 头部：标题 + 模式切换 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-toggle {
  display: flex;
  gap: 6px;
}

.mode-chip {
  padding: 6px 16px;
  border-radius: 18px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #b0e8cc;
}

.mode-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(34, 197, 94, 0.4);
  color: #d0ffe8;
}

.mode-chip.active {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgba(34, 197, 94, 0.6);
  color: #e0fff0;
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.2);
}

.toggle-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #b8e0cc;
  transition: all 0.15s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #d8fff0;
}

/* 模拟模式提示 */
.mock-hint {
  font-size: 15px;
  color: #c0e8d8;
  padding: 10px 14px;
  background: rgba(40, 80, 100, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(80, 180, 220, 0.2);
  line-height: 1.5;
}

/* 2x2 平台网格 */
.platform-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.platform-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.platform-tile:hover {
  border-color: rgba(34, 197, 94, 0.45);
  background: rgba(255, 255, 255, 0.08);
}

.platform-tile.configured {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.1);
}

.tile-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tile-icon {
  font-size: 22px;
}

.tile-name {
  font-size: 16px;
  font-weight: 700;
  color: #e0fff0;
  flex: 1;
}

.tile-status {
  font-size: 16px;
}

.tile-desc {
  font-size: 13px;
  color: #a0d0b8;
  padding-left: 30px;
}

.platform-tile.configured .tile-desc {
  color: #80e8a8;
}

/* 凭证详情展开区 */
.cred-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.cred-detail-card {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 16px 18px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 17px;
  font-weight: 700;
  color: #e0fff0;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.close-btn {
  background: none;
  border: none;
  color: #a0c8b8;
  font-size: 18px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.15s;
}

.close-btn:hover {
  color: #ff8888;
  background: rgba(255, 0, 0, 0.15);
}

/* 凭证获取指南 */
.cred-guide {
  background: rgba(30, 70, 120, 0.3);
  border: 1px solid rgba(80, 160, 240, 0.2);
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 14px;
}

.guide-title {
  font-size: 14px;
  font-weight: 700;
  color: #a8d0f0;
  margin-bottom: 6px;
}

.guide-steps {
  margin: 0;
  padding-left: 20px;
  list-style: decimal;
}

.guide-steps li {
  font-size: 13px;
  color: #98c0e0;
  line-height: 1.55;
  margin-bottom: 3px;
}

.guide-steps a {
  color: #78c0ff;
  text-decoration: none;
  font-weight: 600;
}

.guide-steps a:hover {
  text-decoration: underline;
  color: #a0d8ff;
}

.guide-steps b {
  color: #b8e0ff;
}

.cred-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cred-field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cred-label {
  font-size: 14px;
  font-weight: 600;
  color: #b0e8c8;
}

.cred-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
  color: #e0fff0;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.cred-input::placeholder {
  color: rgba(180, 220, 200, 0.4);
  font-size: 14px;
}

.cred-input:focus {
  border-color: rgba(34, 197, 94, 0.55);
  background: rgba(0, 0, 0, 0.5);
}

.cred-hint {
  font-size: 12px;
  color: #90c0a8;
  line-height: 1.4;
}

/* 操作按钮 */
.cred-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-sm {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #c0f0d8;
}

.btn-sm:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0fff0;
}

.btn-primary-sm {
  background: rgba(34, 197, 94, 0.35);
  border-color: rgba(34, 197, 94, 0.5);
  color: #d0ffe8;
}

.btn-primary-sm:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.5);
}

.btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
