// api/generate.js - Vercel Serverless Function (SDK Version)
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

    if (!apiKey) {
        return res.status(500).json({ error: "서버에 API Key가 설정되지 않았습니다. Vercel 환경 변수를 확인해주세요." });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "POST 요청만 허용됩니다." });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "프롬프트가 누락되었습니다." });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // 1. 먼저 Pro 모델로 시도해 봅니다.
        let modelName = "gemini-1.5-pro";
        let model = genAI.getGenerativeModel({ model: modelName });

        let result;
        try {
            result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return res.status(200).json({ result: text, model: modelName });
        } catch (proError) {
            console.error('Pro Model failed, trying Flash:', proError.message);

            // 2. Pro 실패 시 가장 호환성이 높은 Flash 모델로 자동 전환(Fallback) 합니다.
            modelName = "gemini-1.5-flash";
            model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return res.status(200).json({ result: text, model: modelName });
        }
    } catch (error) {
        console.error('Gemini SDK Error:', error);

        let errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";

        // 상세 에러 안내
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            errorMessage = "모델을 찾을 수 없습니다. (에러 404)\n1. API Key가 'Google AI Studio'에서 발급된 것인지 확인해 주세요.\n2. Vercel 설정에서 API Key 앞뒤에 공백이 없는지 확인해 주세요.";
        } else if (errorMessage.includes("403") || errorMessage.includes("permission")) {
            errorMessage = "접근 권한이 없습니다. (에러 403)\nAPI Key가 활성화된 상태인지 확인해 주세요.";
        }

        res.status(500).json({ error: errorMessage });
    }
}
