// script.js - 프론트엔드 비즈니스 로직

document.addEventListener('DOMContentLoaded', () => {
    // 탭 전환 로직
    const tabBtns = document.querySelectorAll('.tab-btn');
    const inputSections = document.querySelectorAll('.input-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            inputSections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');

            // 결과창 초기화
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'none';
        });
    });
});

async function generateName(type) {
    const loading = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const loadingMsg = document.getElementById('loading-msg');

    let prompt = "";

    if (type === 'baby') {
        const surname = document.getElementById('surname').value.trim();
        const gender = document.getElementById('gender').value;
        const vibe = document.getElementById('vibe').value.trim();

        if (!surname) { alert("성씨를 입력해 주세요."); return; }

        loadingMsg.innerText = "아기별이 축복의 이름을 찾는 중입니다...";
        prompt = `${surname}씨 성을 가진 아기에게 어울리는 이름을 5개 추천해 줘. 
                 성별은 ${gender === 'boy' ? '남자' : gender === 'girl' ? '여자' : '무관'}이고, 
                 느낌은 '${vibe}' 스타일로 지어줘. 각 이름에 대한 예쁜 의미도 한 줄씩 설명해 줘.`;
    } else {
        const industry = document.getElementById('industry').value.trim();
        const brandVibe = document.getElementById('brand-vibe').value.trim();

        if (!industry) { alert("업종을 입력해 주세요."); return; }

        loadingMsg.innerText = "멋진 상호명을 구상 중입니다...";
        prompt = `'${industry}' 분야에 어울리는 세련된 상호명 5개를 추천해 줘. 
                 브랜드 이미지는 '${brandVibe}' 느낌이야. 각 이름의 컨셉도 짧게 설명해 줘.`;
    }

    // UI 상태 업데이트
    loading.style.display = 'flex';
    resultDiv.style.display = 'none';
    resultDiv.innerText = "";

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (response.ok) {
            resultDiv.innerText = data.result;
            resultDiv.style.display = 'block';
        } else {
            // 에러 발생 시 상세 정보 표시
            resultDiv.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">오류가 발생했습니다:</span><br>${data.error.replace(/\n/g, '<br>')}`;
            resultDiv.style.display = 'block';
        }
    } catch (error) {
        resultDiv.innerText = "네트워크 오류가 발생했습니다: " + error.message;
        resultDiv.style.display = 'block';
    } finally {
        loading.style.display = 'none';
        // 결과창으로 스크롤
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
}
