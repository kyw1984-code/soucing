import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';

  if (!keyword) return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });

  // 1. Red Ocean Keywords Handling (Surgical Matching)
  const broadRedKeywords = [
    '이어폰', '블루투스 이어폰', '텐트', '캠핑 텐트', '마스크', '생수', '기저귀', '충전기', 
    '케이블', '비타민', '영양제', '물티슈'
  ];
  
  const exactRedKeywords = [
    '침대', '의자', '양말', '샴푸', '치약', '칫솔', '슬리퍼', '텀블러', '선스크린', '면도기', 
    '물통', '베개', '보조배터리'
  ];
  
  const isExactRed = exactRedKeywords.some(red => keyword === red) || broadRedKeywords.some(red => keyword === red);
  const isContainsRed = broadRedKeywords.some(red => keyword.includes(red));

  // Consistent mock data generation based on keyword name
  const hash = Array.from(keyword).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // 2. Realistic Search Volume
  let searchVolume = Math.floor((hash % 100) * 1500 + 9000);
  if (keyword.length < 3) searchVolume *= 4; 
  if (isExactRed) searchVolume *= 4.5;
  else if (isContainsRed) searchVolume *= 2.5;

  // 3. Realistic Product Count
  let productMultiplier = (hash % 15) * 0.5 + 0.2; 
  if (isExactRed) {
    productMultiplier = 250 + (hash % 100);
  } else if (isContainsRed) {
    const isLongTail = keyword.split(' ').length >= 2 || keyword.length > 5;
    productMultiplier = isLongTail ? 15 + (hash % 20) : 60 + (hash % 40);
  }

  const totalProducts = Math.floor(searchVolume * productMultiplier * 1.05);
  const competitionRate = (totalProducts / searchVolume).toFixed(2);
  
  // 4. Balanced Grade Logic
  let grade: 'Excellent' | 'Good' | 'Fair' | 'Bad' = 'Bad';
  const score = parseFloat(competitionRate);
  if (score < 5.0) grade = 'Excellent';
  else if (score < 15.0) grade = 'Good';
  else if (score < 25.0) grade = 'Fair';
  else grade = 'Bad';

  if (isExactRed && score > 20.0) grade = 'Bad';

  // 5. PRICE RANGE (Min/Max/Avg)
  const baseAvgPrice = Math.floor((hash % 40) * 1000 + 20000);
  const minPrice = Math.floor(baseAvgPrice * (0.6 + (hash % 10) * 0.02));
  const maxPrice = Math.floor(baseAvgPrice * (1.8 + (hash % 10) * 0.05));

  // 6. TREND DATA (Seasonality)
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const monthHash = Math.sin((hash + i) * 0.5) * 0.3 + 1;
    return Math.floor(searchVolume * monthHash * 0.8);
  });
  
  const currentTrend = trendData[11] > trendData[10] ? 'Rising' : 'Steady';
  const marketTrend = searchVolume > 30000 ? 'Volume Burst' : (grade === 'Excellent' ? 'Niche Gold' : 'Steady Growth');

  return NextResponse.json({
    keyword,
    searchVolume,
    totalProducts,
    competitionRate: parseFloat(competitionRate),
    grade,
    averagePrice: baseAvgPrice,
    minPrice,
    maxPrice,
    trendData,
    marketTrend,
    currentTrend,
    top10VolumeIndex: Math.floor((hash % 30) * 5 + 30),
  });
}
