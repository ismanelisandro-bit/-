import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Presentation, Slide } from "../types";

const apiKey = process.env.API_KEY;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to convert Blob/File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateLessonPlan = async (
  textContext: string,
  imageParts: { inlineData: { data: string; mimeType: string } }[]
): Promise<Presentation> => {
  
  const modelId = "gemini-2.5-flash"; // Good balance of speed and reasoning

  const prompt = `
    你是一位专业的教育家。请根据提供的文本和图片内容，制作一份互动式教学PPT的大纲。
    
    要求：
    1. 语言必须是中文。
    2. 如果内容较长，请拆分成多个幻灯片（Slide）。
    3. 每个幻灯片必须包含一个"互动问题"（Quiz），用于课堂提问。
    4. 问题的解析（explanation）要非常详细，适合老师讲解。
    5. 返回格式必须是JSON。
  `;

  const inputContents = [];
  
  if (textContext) {
    inputContents.push({ text: `参考资料文本: ${textContext}` });
  }
  
  imageParts.forEach(part => {
    inputContents.push(part);
  });

  inputContents.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: inputContents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "课程主题名称" },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "幻灯片标题" },
                  contentPoints: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "核心知识点列表"
                  },
                  quiz: {
                    type: Type.OBJECT,
                    description: "互动选择题",
                    properties: {
                      question: { type: Type.STRING, description: "题目内容" },
                      options: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "4个选项内容 (不含ABCD前缀)"
                      },
                      correctAnswerIndex: { type: Type.INTEGER, description: "正确答案的索引 (0-3)" },
                      explanation: { type: Type.STRING, description: "详细的答案解析" }
                    },
                    required: ["question", "options", "correctAnswerIndex", "explanation"]
                  }
                },
                required: ["id", "title", "contentPoints", "quiz"]
              }
            }
          },
          required: ["topic", "slides"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Presentation;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Generate Lesson Error:", error);
    throw error;
  }
};

// Audio Utilities
const decodeAudioData = async (
  base64String: string,
  ctx: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await ctx.decodeAudioData(bytes.buffer);
};

export const generateSpeechForSlide = async (text: string): Promise<AudioBuffer> => {
  // Use TTS model
  const modelId = "gemini-2.5-flash-preview-tts";
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: `请用清晰、专业的中文老师口吻朗读以下教学解析：${text}` }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Kore' is usually good for clarity
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return await decodeAudioData(base64Audio, audioContext);

  } catch (error) {
    console.error("TTS Generation Error:", error);
    throw error;
  }
};