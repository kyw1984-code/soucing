import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName') || '이 상품';

  if (!productId) {
    return NextResponse.json({ error: 'ProductId is required' }, { status: 400 });
  }

  // 1. Identify Category (Keyword-based Dictionary Expansion)
  const categoryTemplates: { [key: string]: any } = {
    electronics: {
      keywords: ['이어폰', '블루투스', '충전', '배터리', '가습기', '전자', '무선', '헤드폰', '스피커', '워치', '마우스', '키보드', '가전', '카메라', '드라이기', '에어컨', '선풍기', '히터', '청소기', '조명', '램프', '전등', '스포트라이트', '모니터', '노트북', '공기청정기', '로봇청소기', '커피머신'],
      pros: ["압도적인 연결 안정성", "직관적인 조작성", "장시간 사용 시 최적의 성능 유지"],
      cons: ["주변 소음 차단 아쉬움", "고속 충전 시 미세 발열", "전용 앱의 호환성 부족"],
      point: "배터리 효율과 페어링 편의성을 강조한 실사 이미지를 상세페이지 전면에 배치하세요."
    },
    camping: {
      keywords: ['텐트', '캠핑', '폴딩', '박스', '의자', '테이블', '랜턴', '그리들', '버너', '침낭', '타프', '차박', '수납함', '구이바다', '아웃도어', '웨건', '아이스박스', '코펠', '난로'],
      pros: ["설치가 매우 직관적이고 빠름", "동급 대비 가벼운 무게", "공간 활용도가 뛰어난 설계"],
      cons: ["체결 부위 내구성 보완 필요", "스크래치에 다소 취약한 도장", "가방 지퍼의 마감 아쉬움"],
      point: "실제 캠핑 환경에서의 설치 영상과 수납 효율성을 강조하는 전략이 유효합니다."
    },
    living: {
      keywords: ['주방', '욕실', '청소', '매트', '시계', '조명', '침구', '커튼', '그릇', '식기', '인테리어', '거울', '카페트', '섬유', '탈취제', '디퓨저', '향수', '수저', '칼', '수건', '빨래', '옷걸이', '옷정리', '행거', '슬리퍼', '욕실화', '우산', '수납장'],
      pros: ["인테리어와 조화로운 디자인", "매우 합리적인 가성비", "간결하고 깔끔한 마감 상태"],
      cons: ["초기 개봉 시 소재 특유의 냄새", "색상이 화면과 다소 차이 있음", "습기에 장시간 노출 시 주의"],
      point: "실제 거주 공간에 배치된 감성 이미지를 통해 라이프스타일을 제안하는 소싱 전략을 추천합니다."
    },
    fashion: {
      keywords: ['의류', '양말', '셔츠', '티셔츠', '신발', '가방', '모자', '잠옷', '속옷', '잡화', '원피스', '바지', '청바지', '팬츠', '니트', '가디건', '자켓', '코트', '패딩', '점퍼', '수트', '벨트', '레깅스', '훈련', '스포츠웨어', '짐웨어', '브라', '팬티', '스니커즈', '구두', '샌들', '부츠', '백팩', '클러치', '액세서리', '귀걸이', '목걸이'],
      pros: ["피부에 닿는 부드러운 소재감", "세탁 후에도 변형 없는 내구성", "트렌디한 디자인과 색감"],
      cons: ["실제 사이즈가 정사이즈보다 작음", "일부 마감 실밥 처리 미흡", "물빠짐 현상 주의 필요"],
      point: "정확한 실측 가이드와 소재의 고화질 디테일 컷을 활용해 구매 결정력을 높이세요."
    },
    beauty: {
      keywords: ['화장품', '스킨', '로션', '크림', '앰플', '세럼', '마스크팩', '썬크림', '선크림', '비비크림', '파운데이션', '립스틱', '틴트', '아이라이너', '마스카라', '샴푸', '린스', '트리트먼트', '헤어팩', '바디워시', '비누', '클렌징', '폼클렌징'],
      pros: ["피부 자극 없는 순한 성분", "번들거림 없는 산뜻한 제형", "오랜 시간 유지되는 지속력"],
      cons: ["피부 타입에 따른 호불호", "일부 성분의 특유의 향", "한 번에 쏟아지기 쉬운 용기 구조"],
      point: "전성분 공개와 피부 무자극 테스트 인증을 상세페이지 최상단에 노출하여 신뢰를 확보하세요."
    },
    general: {
      keywords: [],
      pros: ["누구나 사용하기 쉬운 대중적인 상품", "배송 시 파손 걱정 없는 튼튼한 포장", "가격 대비 높은 체감 만족도"],
      cons: ["배송 시간의 다소 지연 가능성", "박스 훼손 사례 소수 존재", "다양한 컬러 옵션 부재"],
      point: "실제 구매 고객들의 솔직한 후기를 적극적으로 노출하여 잠재 고객의 불안감을 제거하세요."
    }
  };

  // 2. Perform Matching
  let matchKey = 'general';
  const lowerName = productName.toLowerCase();
  
  for (const [key, template] of Object.entries(categoryTemplates)) {
    if (key === 'general') continue;
    if (template.keywords.some((kw: string) => lowerName.includes(kw))) {
      matchKey = key;
      break;
    }
  }

  const analysis = categoryTemplates[matchKey];
  const hash = Array.from(productId).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return NextResponse.json({
    productId,
    productName,
    analysis: {
      positive: analysis.pros,
      negative: analysis.cons,
      sourcingPoint: analysis.point,
    },
    score: (hash % 15) + 85, // Consistent high score for premium look
  });
}
