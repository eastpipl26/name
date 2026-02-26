// api/generate.js - Vercel Serverless Function
// 이 코드는 서버에서 실행되므로 API Key가 사용자 브라우저에 노출되지 않습니다.

export default async function handler(req, res) {
    // 1. 보안 설정: API 키는 환경 변수에서 가져옵니다.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "서버에 API Key가 설정되지 않았습니다." });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "POST 요청만 허용됩니다." });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "프롬프트가 누락되었습니다." });
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        res.status(200).json({ result: aiText });
    } catch (error) {
        console.error('API 호출 오류:', error);
        res.status(500).json({ error: "AI 응답 생성 중 오류가 발생했습니다." });
    }
}
