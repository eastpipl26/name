// api/generate.js - Vercel Serverless Function (REST v1 정밀 진단 버전)

export default async function handler(req, res) {
    // 1. 보안: 환경 변수에서 API Key 가져오기 (공백 완벽 제거)
    const rawKey = process.env.GEMINI_API_KEY || "";
    const apiKey = rawKey.trim();

    // 진단용 마스킹 정보 생성
    const maskedKey = apiKey.length > 8
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
        : "키가 너무 짧거나 없음";

    if (!apiKey) {
        return res.status(500).json({
            error: `API Key가 설정되지 않았습니다.\nVercel 환경변수에서 GEMINI_API_KEY를 확인해 주세요.`
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "POST 요청만 허용됩니다." });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "요청 내용이 없습니다." });
    }

    // [중요] 가장 안정적인 REST v1 엔드포인트를 사용합니다. (v1beta의 404 이슈 회피)
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
            // 상세 진단 에러 반환
            const errorMsg = data.error ? data.error.message : "알 수 없는 API 에러";
            const diagInfo = `\n\n[🔧 정밀 진단 정보]\n- 시도한 키: ${maskedKey}\n- 키 글자 수: ${apiKey.length}\n- 응답 코드: ${response.status}\n- 상세 원인: ${errorMsg}`;

            return res.status(500).json({
                error: `구글 AI 연동 오류입니다.${diagInfo}\n\n※ 키가 AIza로 시작하는지, Vercel에서 Redeploy를 했는지 확인해 주세요.`
            });
        }
    } catch (error) {
        return res.status(500).json({ error: "서버 내부 오류: " + error.message });
    }
}
