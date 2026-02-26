// api/generate.js - Vercel Serverless Function (REST v1 Version)
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

    const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;

    // 가장 표준적인 v1 엔드포인트를 사용합니다. (SDK의 v1beta 오류를 피하기 위함)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.candidates && data.candidates.length > 0) {
                const text = data.candidates[0].content.parts[0].text;
                return res.status(200).json({ result: text });
            } else {
                throw new Error("AI가 응답을 생성하지 못했습니다.");
            }
        } else {
            // 구글 서버의 에러 메시지를 상세히 출력합니다.
            const errorMsg = data.error ? data.error.message : "알 수 없는 API 에러";
            const diagInfo = `\n\n[진단 정보]\n- 시도한 키: ${maskedKey}\n- 응답 코드: ${response.status}\n- 에러 내용: ${errorMsg}`;

            return res.status(500).json({
                error: `구글 AI 서버 오류입니다.${diagInfo}`
            });
        }
    } catch (error) {
        return res.status(500).json({ error: "시스템 오류: " + error.message });
    }
}
