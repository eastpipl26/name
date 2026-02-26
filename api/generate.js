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
        // 구글 공식 SDK를 사용하여 모델을 호출합니다. (URL을 직접 적지 않아도 되어 안전합니다.)
        const genAI = new GoogleGenerativeAI(apiKey);

        // 사용자가 Pro를 사용한다고 하였으므로 gemini-1.5-pro 모델을 우선 시도합니다.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ result: text });
    } catch (error) {
        console.error('Gemini SDK Error:', error);

        // 에러 메시지 분석
        let errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";

        // 만약 Pro 모델이 권한 문제로 안 될 경우를 대비해 안내 추가
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            errorMessage = "API에서 모델을 찾을 수 없습니다. API Key가 Google AI Studio용인지 확인해 주세요.";
        }

        res.status(500).json({ error: errorMessage });
    }
}
