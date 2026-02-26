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
        const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "없음";
        const keyLength = apiKey ? apiKey.length : 0;

        console.log(`Diagnostic: Key Length=${keyLength}, Masked=${maskedKey}`);

        const genAI = new GoogleGenerativeAI(apiKey);

        // 가장 호환성이 높은 모델 하나를 우선 타겟팅하여 진단합니다.
        const modelName = "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return res.status(200).json({ result: text, model: modelName });
        } catch (sdkError) {
            // 구글 서버의 날것 그대로의 에러를 잡습니다.
            console.error('Google API Raw Error:', sdkError);

            const diagInfo = `\n\n[진단 정보]\n- 입력된 키: ${maskedKey} (길이: ${keyLength})\n- 에러 내용: ${sdkError.message}`;

            return res.status(500).json({
                error: `구글 서버 응답 오류입니다.${diagInfo}\n\n위 정보를 캡처해서 알려주시면 바로 해결 가능합니다!`
            });
        }
    } catch (error) {
        res.status(500).json({ error: "시스템 초기화 오류: " + error.message });
    }
}
