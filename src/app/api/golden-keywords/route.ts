import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Vercel CDN 캐싱 방지

export async function GET() {
  const pool = [
    { keyword: '캠핑용 그리들 팬', category: '캠핑/아웃도어', searchVolume: 82000, competitionRate: 0.85, grade: 'Excellent', hotIndex: 98 },
    { keyword: '무선 보풀제거기 추천', category: '생활가전', searchVolume: 45000, competitionRate: 1.1, grade: 'Excellent', hotIndex: 95 },
    { keyword: '친환경 실리콘 조리도구', category: '주방용품', searchVolume: 32000, competitionRate: 1.4, grade: 'Good', hotIndex: 88 },
    { keyword: '사무실 데스크테리어 소품', category: '인테리어', searchVolume: 120000, competitionRate: 1.8, grade: 'Good', hotIndex: 92 },
    { keyword: '대용량 가습기 아로마', category: '가전', searchVolume: 67000, competitionRate: 0.95, grade: 'Excellent', hotIndex: 94 },
    { keyword: '강아지 산책 슬링백', category: '반려동물', searchVolume: 51000, competitionRate: 1.25, grade: 'Good', hotIndex: 89 },
    { keyword: '원목 모니터 받침대', category: '사무용품', searchVolume: 74000, competitionRate: 1.12, grade: 'Excellent', hotIndex: 97 },
    { keyword: '캠핑용 무선 선풍기', category: '캠핑/아웃도어', searchVolume: 91000, competitionRate: 1.15, grade: 'Good', hotIndex: 93 },
    { keyword: '아이패드 파우치 11인치', category: '모바일액세서리', searchVolume: 58000, competitionRate: 1.3, grade: 'Good', hotIndex: 84 },
    { keyword: '욕실 규조토 매트', category: '욕실용품', searchVolume: 110000, competitionRate: 0.88, grade: 'Excellent', hotIndex: 99 },
    { keyword: '수납용 폴딩 박스', category: '생활잡화', searchVolume: 42000, competitionRate: 1.05, grade: 'Excellent', hotIndex: 91 },
    { keyword: '무선 핸디 청소기', category: '소형가전', searchVolume: 135000, competitionRate: 1.65, grade: 'Good', hotIndex: 87 },
    { keyword: '접이식 캠핑 의자', category: '캠핑/아웃도어', searchVolume: 76000, competitionRate: 1.0, grade: 'Excellent', hotIndex: 96 },
    { keyword: '미니 에어프라이어', category: '주방가전', searchVolume: 98000, competitionRate: 1.35, grade: 'Good', hotIndex: 90 },
    { keyword: '반려견 자동 급수기', category: '반려동물', searchVolume: 39000, competitionRate: 0.9, grade: 'Excellent', hotIndex: 93 },
    { keyword: '접이식 독서대', category: '사무용품', searchVolume: 55000, competitionRate: 1.0, grade: 'Excellent', hotIndex: 91 },
    { keyword: '차량용 무선 충전 거치대', category: '자동차용품', searchVolume: 88000, competitionRate: 1.2, grade: 'Good', hotIndex: 92 },
    { keyword: '실리콘 케이블 정리함', category: '생활잡화', searchVolume: 29000, competitionRate: 0.8, grade: 'Excellent', hotIndex: 89 },
    { keyword: '냉장고 수납 정리함', category: '주방용품', searchVolume: 63000, competitionRate: 1.1, grade: 'Excellent', hotIndex: 94 },
    { keyword: '미니 빔프로젝터 휴대용', category: '전자기기', searchVolume: 47000, competitionRate: 1.4, grade: 'Good', hotIndex: 86 },
    { keyword: '다용도 세탁망 대형', category: '생활용품', searchVolume: 33000, competitionRate: 0.75, grade: 'Excellent', hotIndex: 88 },
  ];

  // 날짜 기반 시드로 매일 다른 7개 추출
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // 선형 합동 생성기(LCG)로 결정론적 셔플
  let seed = dateSeed;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return NextResponse.json(shuffled.slice(0, 7), {
    headers: {
      'Cache-Control': 'no-store', // 브라우저 캐싱도 방지
    },
  });
}
