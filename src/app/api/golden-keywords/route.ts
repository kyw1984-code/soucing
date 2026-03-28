import { NextResponse } from 'next/server';

export async function GET() {
  // Larger pool of high-potential "Golden Keywords"
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
  ];

  // Logic: Change keywords every day using Date seed
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Deterministic shuffle based on seed
  const shuffled = [...pool].sort((a, b) => {
    const scoreA = (Array.from(a.keyword).reduce((acc, c) => acc + c.charCodeAt(0), 0) + dateSeed) % 100;
    const scoreB = (Array.from(b.keyword).reduce((acc, c) => acc + c.charCodeAt(0), 0) + dateSeed) % 100;
    return scoreB - scoreA;
  });

  // Return a subset (e.g., 6 items)
  return NextResponse.json(shuffled.slice(0, 7));
}
