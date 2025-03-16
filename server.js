/**
 * server.js (示例: Node.js + Express + OpenAI GPT)
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Configuration, OpenAIApi } = require('openai');  // <-- OpenAI SDK

const app = express();
const PORT = process.env.PORT || 3000;

// 使用 Helmet 设置安全头等
app.use(helmet());

// 解析 JSON
app.use(express.json());

// 请求限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: '请求过于频繁，请稍后再试'
});
app.use(limiter);

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// =========== OpenAI 配置 ===========
// 注意：请将 YOUR_OPENAI_API_KEY 替换为你的实际 API Key，或从环境变量读取
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// =========== 模拟的传感器接口 (仅示例) =========== 
app.get('/api/sensors', (req, res) => {
  const data = {
    temperature: (20 + Math.random() * 5).toFixed(1),
    humidity: (40 + Math.random() * 20).toFixed(1),
    light: (300 + Math.random() * 100).toFixed(0),
    humanDetect: Math.random() > 0.5 ? '有人' : '无人'
  };
  res.json(data);
});

// =========== 核心：AI 生成节能建议接口 =========== 
app.get('/api/ai-suggestion', async (req, res) => {
  try {
    // 1. 获取传感器数据(可以从数据库或硬件获取，这里演示直接调用上面模拟接口)
    //   - 这里为了演示，直接随机生成，或在真实项目中先请求 /api/sensors
    const sensorData = {
      temperature: (20 + Math.random() * 5).toFixed(1),
      humidity: (40 + Math.random() * 20).toFixed(1),
      light: (300 + Math.random() * 100).toFixed(0),
      humanDetect: Math.random() > 0.5 ? '有人' : '无人'
    };

    // 2. 构造给 GPT 的 prompt
    //    这里你可以根据项目需求自定义描述，告诉 GPT 具体要输出什么格式
    const prompt = `
    你是一个智能教室节能顾问。当前教室传感器数据如下：
    - 温度: ${sensorData.temperature} °C
    - 湿度: ${sensorData.humidity} %
    - 光照强度: ${sensorData.light} lux
    - 是否有人: ${sensorData.humanDetect}

    请根据以上数据，从节能角度给出几条具体建议，帮助减少能源浪费，并保持教室舒适度。建议要简洁易懂。
    `;

    // 3. 调用 OpenAI 的 ChatGPT API (GPT-3.5 或 GPT-4)
    //    这里使用 ChatCompletion
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo', 
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7, // 可根据需求调整
    });

    // 4. 从响应中取出建议文本
    const aiSuggestion = response.data.choices[0].message.content.trim();

    // 5. 返回给前端
    res.json({ suggestion: aiSuggestion });

  } catch (error) {
    console.error('调用OpenAI出错:', error);
    res.status(500).json({ error: 'AI生成建议失败，请稍后重试' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
