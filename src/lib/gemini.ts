import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AIExplanationResponse, Question } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < maxRetries - 1) {
        // Add jitter to avoid thundering herd
        const jitter = Math.random() * 1000;
        const delay = (initialDelay * Math.pow(2, i)) + jitter;
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function generateDetailedExplanation(subject: string, concept: string, currentExplanation: string): Promise<AIExplanationResponse> {
  try {
    const response = await withRetry(() => genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an expert tutor for BECE and WASSCE students, provide a more detailed and personalized explanation for the following concept in ${subject}. 
      
Concept: ${concept}
Initial Explanation: ${currentExplanation}

Please:
1. Explain it in simple English.
2. Use a relatable real-world example.
3. Address common misconceptions students might have about this topic.
4. Keep it engaging and encouraging.
5. Include a "Did You Know?" fun fact related to this topic.
6. Also, generate 3 practice multiple-choice questions related to this concept.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            didYouKnow: { type: Type.STRING, description: "A fun or interesting fact related to the topic." },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["text", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["explanation", "didYouKnow", "questions"]
        }
      }
    }));

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Error generating explanation:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("The AI Tutor is currently experiencing high demand. Please try again in a minute.");
    }
    throw new Error("Failed to generate AI explanation. Please try again later.");
  }
}

export async function generateSpeech(text: string): Promise<string> {
  try {
    const response = await withRetry(() => genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly and educationally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received");
    }
    return base64Audio;
  } catch (error: any) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate voice explanation.");
  }
}

export async function generateAIQuiz(subjectName: string, syllabus: string[], isAdvanced: boolean): Promise<Question[]> {
  try {
    const response = await withRetry(() => genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an expert teacher, generate 5 multiple-choice questions for the subject: ${subjectName}.
      
The questions should be based on the following syllabus topics: ${syllabus.join(", ")}.
Difficulty: ${isAdvanced ? "Advanced (WASSCE level)" : "Standard (BECE level)"}.

Please:
1. Use simple, clear English.
2. Ensure each question has exactly 4 options.
3. Provide a clear explanation for each correct answer.
4. Return the result as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["id", "text", "options", "correctAnswer", "explanation"]
          }
        }
      }
    }));

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Error generating AI quiz:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("The AI Quiz generator is currently busy. Please try again in a minute.");
    }
    throw new Error("Failed to generate AI quiz. Please try again later.");
  }
}

export async function generatePastQuestions(subjectName: string, year: number, examType: string): Promise<Question[]> {
  try {
    const response = await withRetry(() => genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an expert West African examiner, generate 10 authentic multiple-choice questions for the ${examType} ${subjectName} exam from the year ${year}.
      
The questions should reflect the actual curriculum and exam style of ${year}.
If the year ${year} is in the future or too far in the past for specific records, generate highly realistic questions that would fit that era's standards.

Please:
1. Use the exact terminology and style used in ${examType} exams.
2. Ensure each question has exactly 4 options.
3. Provide a clear, educational explanation for each correct answer.
4. Return the result as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["id", "text", "options", "correctAnswer", "explanation"]
          }
        }
      }
    }));

    const questions = JSON.parse(response.text || "[]");
    return questions.map((q: any) => ({ ...q, year, examType }));
  } catch (error: any) {
    console.error("Error generating past questions:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("The Past Questions server is currently busy. Please try again in a minute.");
    }
    throw new Error("Failed to load past questions. Please try again later.");
  }
}
