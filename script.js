// script.js

document.addEventListener('DOMContentLoaded', () => {
    // 탭 전환 로직
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                const resultBox = c.querySelector('.result-box');
                if (resultBox) resultBox.classList.add('hidden');
            });
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
});

// 설정 모달 토글 (이제 도움말용으로 사용하거나 숨길 수 있음)
function toggleSettings() {
    alert("이 버전은 서버 보안 모드입니다. API 키는 서버 설정에서 관리됩니다.");
}

// 실제서버 API 호출 함수 (보안 방식)
async function callGeminiAPI(prompt) {
    // 이제 브라우저에서 직접 API를 부르지 않고, 우리가 만든 서버(/api/generate)로 요청을 보냅니다.
    const url = `/api/generate`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();

        if (data.error) {
            alert('오류: ' + data.error);
            return null;
        }

        return data.result;
    } catch (error) {
        console.error('서버 통신 오류:', error);
        alert('서버와 통신하는 중 오류가 발생했습니다. 배포 설정을 확인해주세요.');
        return null;
    }
}

// 결과 생성 시뮬레이션 및 실제 호출
async function generateResult(type) {
    const loading = document.getElementById('loading');
    const resultBox = document.getElementById(`${type}-result`);
    const loadingText = document.getElementById('loading-text');

    const messages = {
        saju: "사주와 오행을 정밀 분석 중입니다...",
        trend: "최신 랭킹 데이터와 트렌드를 분석 중...",
        nickname: "소중한 기억을 담은 태명을 짓는 중...",
        global: "세련된 글로벌 감성을 찾는 중...",
        family: "가족의 이름을 엮어 의미를 만드는 중..."
    };
    loadingText.innerText = messages[type];

    resultBox.classList.add('hidden');
    loading.classList.remove('hidden');

    // 프롬프트 생성 로직
    let prompt = "";
    if (type === 'trend') {
        const genderElement = document.querySelector(`input[name="trend-gender"]:checked`);
        const gender = genderElement ? genderElement.value : 'neutral';
        prompt = `올해 2024~2025년 대한민국에서 유행하는 ${gender === 'boy' ? '남자' : gender === 'girl' ? '여자' : '중성적인'} 아기 이름 랭킹 TOP 5를 알려주고 각각 1문장씩 선정 이유를 적어줘. 결과는 한 줄씩 이름: 설명 형태로 해줘.`;
    } else if (type === 'nickname') {
        const memory = document.getElementById('nickname-memory').value;
        const keywords = Array.from(document.querySelectorAll('#nickname input[type="checkbox"]:checked')).map(c => c.value).join(', ');
        prompt = `${keywords} 느낌의 태명 3개를 지어줘. 특히 부모님의 소중한 기억인 "${memory}"의 느낌이 나도록 해줘. 이름: 한 줄 설명 형태로 3개만 추천해줘.`;
    } else if (type === 'family') {
        const dad = document.getElementById('dad-name-kr').value;
        const mom = document.getElementById('mom-name-kr').value;
        const dolimja = document.getElementById('dolimja-kr').value;
        const posElement = document.querySelector(`input[name="dolimja-pos"]:checked`);
        const pos = posElement ? posElement.value : 'any';
        prompt = `아빠 ${dad}, 엄마 ${mom}의 이름을 참고하고, 돌림자 "${dolimja}"를 이름의 ${pos === 'front' ? '앞' : '뒤'}에 넣어서 세련된 아기 이름 2개를 지어주고 이유를 설명해줘. 이름: 설명 형태로.`;
    } else if (type === 'saju') {
        const lastName = document.getElementById('saju-last-name').value;
        const birth = document.getElementById('saju-datetime').value;
        prompt = `성씨가 ${lastName}이고 생년월일시가 ${birth}인 아이의 사주 오행을 분석해서, 부족한 기운을 채워주는 이름 2개를 한자와 함깨 지어줘. 이름(한자): 설명(오행 포함) 형태로 보여줘.`;
    } else if (type === 'global') {
        const korName = document.getElementById('korean-name').value;
        const vibe = document.getElementById('global-vibe').value;
        prompt = `한국 이름 "${korName}"과 발음이 비슷하거나 ${vibe} 이미지를 가진 영어 이름 3개를 추천하고 뜻을 알려줘. 이름: 설명 형태로.`;
    }

    const aiResponse = await callGeminiAPI(prompt);
    loading.classList.add('hidden');

    if (aiResponse) {
        const lines = aiResponse.split('\n').filter(l => l.includes(':'));
        let htmlContent = `<div class="results">`;
        lines.forEach(line => {
            const parts = line.split(':');
            const name = parts[0];
            const desc = parts.slice(1).join(':'); // 뒤에 콜론이 더 있을 경우 대비
            htmlContent += `
                <div class="name-item">
                    <div class="name-title">${name.trim()}</div>
                    <div class="name-desc">${desc.trim()}</div>
                </div>
            `;
        });

        if (type === 'saju') {
            htmlContent += `
                <div style="text-align: center; margin-top: 1.5rem;">
                    <button class="action-btn premium-btn" style="font-size: 0.9rem;">🔒 부모님 사주 합본 리포트 구매하기 (소액결제)</button>
                </div>
            `;
        }

        htmlContent += `</div>`;
        resultBox.innerHTML = htmlContent;
        resultBox.classList.remove('hidden');
    }
}
