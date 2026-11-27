// 必须在业务模块导入前加载环境变量（.env 文件）
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 限制：默认仅放行本地开发前端，可通过 CORS_ORIGIN 配置白名单（逗号分隔）
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json({ limit: '10mb' }));

// 可选 API Key 鉴权（设置 OMNISYNC_API_KEY 后启用）
app.use('/api', (req, res, next) => {
  const apiKey = process.env.OMNISYNC_API_KEY;
  if (!apiKey) return next();
  const provided = req.header('x-api-key');
  if (provided !== apiKey) {
    return res.status(401).json({ success: false, message: '未授权的请求' });
  }
  return next();
});

// API路由
app.use('/api', apiRoutes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'OmniSync API' });
});

app.listen(PORT, () => {
  const mode = process.env.LIVE_MODE === 'true' ? '真实发布模式' : '模拟模式（开发测试）';
  console.log(`✨ OmniSync 后端服务已启动: http://localhost:${PORT}`);
  console.log(`   当前模式: ${mode}`);
  console.log(`   API 端点: http://localhost:${PORT}/api`);
  if (process.env.LIVE_MODE !== 'true') {
    console.log('   💡 提示: 设置 LIVE_MODE=true 并配置平台凭证可启用真实发布');
    console.log('   📄 参考: backend/.env.example');
  }
});
