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

        // 시도할 모든 모델 후보군입니다.
        const modelsToTry = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // 성공하면 즉시 반환
                return res.status(200).json({ result: text, model: modelName });
            } catch (err) {
                console.error(`${modelName} failed:`, err.message);
                lastError = err;
                continue;
            }
        }

        throw lastError;

    } catch (error) {
        console.error('Final Gemini SDK Error:', error);
        let errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";

        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            errorMessage = "구글 서버에서 모델을 찾을 수 없습니다. (404)\n반드시 'Google AI Studio'에서 새로 발급받은 키를 Vercel에 넣고, [Create Deployment]를 눌러주세요.";
        }
        res.status(500).json({ error: errorMessage });
    }
}
