import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

// 加载环境变量（.env 文件）
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
