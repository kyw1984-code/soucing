import { NextRequest, NextResponse } from 'next/server';

/**
 * AliPrice 자동 클릭 페이지
 * 이미지를 표시하고 AliPrice 확장 버튼이 DOM에 삽입되면 자동 클릭
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ b64: string }> }
) {
  const { b64 } = await params;

  let imageUrl: string;
  try {
    imageUrl = Buffer.from(b64, 'base64url').toString('utf-8');
  } catch {
    return new NextResponse('Invalid base64', { status: 400 });
  }

  const proxyImageUrl = `/api/img/${b64}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>1688 이미지 소싱</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #111;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: sans-serif;
    }
    #status {
      color: #aaa;
      font-size: 13px;
      margin-bottom: 16px;
      text-align: center;
    }
    #status span { color: #f59e0b; font-weight: bold; }
    img#target {
      max-width: 480px;
      max-height: 480px;
      border-radius: 12px;
      display: block;
      cursor: pointer;
    }
    #manual-btn {
      margin-top: 20px;
      padding: 12px 28px;
      background: #f59e0b;
      color: #000;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      display: none;
    }
    #manual-btn:hover { background: #d97706; }
  </style>
</head>
<body>
  <div id="status">AliPrice 버튼 감지 중... <span id="timer">3</span>초 후 자동 클릭</div>
  <img id="target" src="${proxyImageUrl}" alt="product" />
  <button id="manual-btn" onclick="manualSearch()">수동으로 1688 검색하기</button>

  <script>
    const imageUrl = ${JSON.stringify(imageUrl)};
    const proxyUrl = ${JSON.stringify(`https://soucing.vercel.app${proxyImageUrl}`)};

    // AliPrice 확장이 삽입하는 버튼 선택자들
    const ALIPRICE_SELECTORS = [
      '[class*="aliprice"]',
      '[class*="AliPrice"]',
      '[id*="aliprice"]',
      '[class*="ali-price"]',
      'a[href*="aliprice"]',
      'a[href*="aiprice"]',
      '[class*="aiprice"]',
      'div[class*="search-btn"]',
      'span[class*="search-1688"]',
    ];

    let clicked = false;
    let countdown = 5;

    const timerEl = document.getElementById('timer');
    const statusEl = document.getElementById('status');
    const manualBtn = document.getElementById('manual-btn');

    // 카운트다운
    const countdownInterval = setInterval(() => {
      countdown--;
      if (timerEl) timerEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        if (!clicked) {
          // 자동 클릭 실패 → 수동 버튼 표시
          statusEl.innerHTML = 'AliPrice 확장이 감지되지 않았습니다. 아래 버튼을 클릭하세요.';
          manualBtn.style.display = 'block';
        }
      }
    }, 1000);

    function tryClickAliPrice() {
      for (const sel of ALIPRICE_SELECTORS) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (el && el.offsetParent !== null) {
            el.click();
            clicked = true;
            clearInterval(countdownInterval);
            statusEl.innerHTML = '<span>AliPrice 버튼 클릭 완료!</span> 1688 검색 중...';
            return true;
          }
        }
      }
      return false;
    }

    function manualSearch() {
      // 수동 폴백: 1688 키워드 검색
      window.location.href = 'https://www.aiprice.com/s?db=1688&img_url=' + encodeURIComponent(proxyUrl);
    }

    // 이미지 hover 시뮬레이션 (AliPrice는 mouseover 이벤트로 활성화)
    const img = document.getElementById('target');
    setTimeout(() => {
      if (img) {
        img.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        img.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        img.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 240, clientY: 240 }));
      }
    }, 800);

    // MutationObserver로 AliPrice 버튼 감지
    const observer = new MutationObserver(() => {
      if (!clicked && tryClickAliPrice()) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    // 이미지 로드 후 재시도
    if (img) {
      img.addEventListener('load', () => {
        setTimeout(() => {
          img.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          img.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
          tryClickAliPrice();
        }, 1000);
      });
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
