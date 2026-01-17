
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeSystemHealth = async (metrics: any): Promise<string> => {
  if (!apiKey) {
    return "API Key 未配置。请在环境变量中设置 API_KEY 以启用 AI 诊断功能。";
  }

  try {
    const prompt = `
      你是一个工业操作系统“天工·弈控”的智能助手。
      请根据以下产线数据生成一份简短的“体检报告”和优化建议：
      ${JSON.stringify(metrics)}
      
      要求：
      1. 语气专业、冷静、客观。
      2. 重点指出OEE（设备综合效率）是否达标（基准85%）。
      3. 给出1-2条具体的改进建议。
      4. 输出格式为纯文本，不要Markdown。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
    });

    return response.text || "无法生成分析报告。";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "AI 服务暂时不可用，请稍后再试。";
  }
};