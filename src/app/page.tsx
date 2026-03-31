'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Target,
  BarChart3,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  ExternalLink,
  Star,
  MessageSquare,
  User,
  Clock,
  UtensilsCrossed,
  Sparkles,
  Dumbbell,
  Tent,
  Baby,
  PawPrint,
  Sofa,
  Shirt,
  Cpu,
  Download,
  GitCompare,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Heart,
  ShoppingCart,
  Utensils,
  Palette,
  Car,
  Book,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductSkeleton } from '@/components/Skeleton';

const Sparkline = ({ data }: { data: number[] }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-end gap-1.5 h-48 relative">
        {data.map((val, i) => {
          const heightPercent = ((val - min) / range) * 100;
          return (
            <div
              key={i}
              className="flex-1 relative group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-sm transition-all duration-300 hover:from-amber-600 hover:to-amber-500 relative"
                style={{ height: `${Math.max(heightPercent, 5)}%` }}
              >
                {hoveredIndex === i && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl z-10">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-300">{months[i]}</div>
                      <div className="text-sm">{val.toLocaleString()}</div>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-0.5 border-t border-slate-200 pt-2">
        {months.map((m, i) => (
          <span key={i} className="text-[8px] font-bold text-slate-400 tabular-nums">
            {i + 1}
          </span>
        ))}
      </div>
      <p className="text-[9px] font-black text-slate-500 text-center uppercase tracking-widest">월간 검색량 추이 (1월 - 12월)</p>
    </div>
  );
};


interface Review {
  nickname: string;
  rating: number;
  headline: string;
  content: string;
  date: string;
}

interface Product {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  rating?: number;
  ratingCount?: number;
  isRocket?: boolean;
  deliveryType?: 'rocket' | 'jet' | 'general';
  calculated: {
    saleIndex: number;
    competitionStrength: number;
    sourcingScore: number;
    opportunityScore: number;
    grade: 'Excellent' | 'Good' | 'Bad';
  };
}

const SellerLandscape = ({ products }: { products: Product[] }) => {
  if (!products || products.length === 0) return null;

  const total = Math.min(products.length, 20); // Top 20 analysis
  const topProducts = products.slice(0, total);

  const rocket = topProducts.filter(p => p.deliveryType === 'rocket' || (p.isRocket && !p.deliveryType)).length;
  const jet = topProducts.filter(p => p.deliveryType === 'jet').length;
  const general = topProducts.filter(p => p.deliveryType === 'general' || (!p.isRocket && !p.deliveryType)).length;

  // 디버그 로그
  console.log('[SellerLandscape] 상품 배송 타입 분석:', {
    total,
    rocket,
    jet,
    general,
    sample: topProducts.slice(0, 3).map(p => ({
      name: p.productName.substring(0, 20),
      deliveryType: p.deliveryType,
      isRocket: p.isRocket
    }))
  });

  const rocketPct = (rocket / total) * 100;
  const jetPct = (jet / total) * 100;
  const generalPct = (general / total) * 100;

  return (
    <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">판매자 경쟁 분포 (TOP {total})</p>
      </div>

      <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-200">
        <div style={{ width: `${rocketPct}%` }} className="h-full bg-rose-500 transition-all duration-500" title={`로켓: ${rocket}`} />
        <div style={{ width: `${jetPct}%` }} className="h-full bg-amber-500 transition-all duration-500" title={`판매자로켓: ${jet}`} />
        <div style={{ width: `${generalPct}%` }} className="h-full bg-emerald-500 transition-all duration-500" title={`일반배송: ${general}`} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-rose-400 uppercase">로켓</span>
          <span className="text-sm font-black text-slate-800">{Math.round(rocketPct)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-amber-400 uppercase">판매자로켓</span>
          <span className="text-sm font-black text-slate-800">{Math.round(jetPct)}%</span>
        </div>
        <div className="flex flex-col border-l border-slate-300 pl-2">
          <span className="text-[9px] font-black text-emerald-400 uppercase">일반배송</span>
          <span className="text-sm font-black text-slate-800">{Math.round(generalPct)}%</span>
        </div>
      </div>

    </div>
  );
};

export default function SourcingDashboard() {
  const [keyword, setKeyword] = useState('');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('1000000');

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Sourcing states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState(3000);
  const [sourcingMultiplier, setSourcingMultiplier] = useState<number>(300);

  const [searchError, setSearchError] = useState<{ message: string; screenshot?: string } | null>(null);

  const [sortBy, setSortBy] = useState<'sourcingScore' | 'saleIndex' | 'competitionStrength' | 'productPrice'>('sourcingScore');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'Excellent' | 'Good' | 'Fair' | 'Bad'>('all');
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Intel states
  const [keywordStats, setKeywordStats] = useState<any | null>(null);

  
  // Golden trends
  const [goldenKeywords, setGoldenKeywords] = useState<any[]>([]);

  // Persistence for multiplier
  useEffect(() => {
    const saved = localStorage.getItem('sourcingMultiplier');
    if (saved) setSourcingMultiplier(Number(saved));

    // Fetch Golden Keywords
    fetch('/api/golden-keywords')
      .then(res => res.json())
      .then(data => setGoldenKeywords(data));
  }, []);

  const handleMultiplierChange = (val: number) => {
    setSourcingMultiplier(val);
    localStorage.setItem('sourcingMultiplier', String(val));
  };


  const calculateProfitData = (salePrice: number, cost: number, shipping: number) => {
    const coupangFeeRate = 0.12; 
    const fee = Math.round(salePrice * coupangFeeRate);
    const profit = salePrice - cost - shipping - fee;
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    return { fee, profit, margin };
  };


  const { fee, profit, margin } = selectedProduct 
    ? calculateProfitData(selectedProduct.productPrice, wholesalePrice, shippingFee)
    : { fee: 0, profit: 0, margin: 0 };

  const CATEGORIES = [
    { label: '패션의류/잡화', icon: Shirt, subs: [
      { label: '여성패션', items: [
        { label: '의류: 티셔츠/셔츠', keyword: '여성 티셔츠 블라우스' },
        { label: '의류: 원피스', keyword: '여성 원피스' },
        { label: '의류: 팬츠/스커트', keyword: '여성 바지 치마' },
        { label: '의류: 자켓/아우터', keyword: '여성 자켓 가디건' },
        { label: '의류: 니트/가디건', keyword: '여성 니트 가디건' },
        { label: '신발: 스니커즈/로퍼', keyword: '여성 운동화 로퍼' },
        { label: '신발: 힐/샌들', keyword: '여성 구두 샌들' },
        { label: '신발: 부츠/워커', keyword: '여성 부츠 워커' },
        { label: '가방: 핸드백/숄더백', keyword: '여성 핸드백 숄더백' },
        { label: '가방: 백팩/에코백', keyword: '여성 백팩 에코백' },
        { label: '가방: 크로스백/클러치', keyword: '여성 크로스백 클러치' },
        { label: '잡화: 모자/벨트', keyword: '여성 모자 벨트' },
        { label: '잡화: 양말/스타킹', keyword: '여성 양말 스타킹' },
        { label: '잡화: 스카프/머플러', keyword: '여성 스카프 머플러' },
      ]},
      { label: '남성패션', items: [
        { label: '의류: 티셔츠/셔츠', keyword: '남성 반팔 셔츠' },
        { label: '의류: 팬츠/청바지', keyword: '남성 슬랙스 청바지' },
        { label: '의류: 아우터', keyword: '남성 자켓 점퍼' },
        { label: '의류: 니트/맨투맨', keyword: '남성 니트 맨투맨' },
        { label: '신발: 운동화/구두', keyword: '남성 스니커즈 정장구두' },
        { label: '신발: 슬리퍼/샌들', keyword: '남성 슬리퍼 샌들' },
        { label: '잡화: 가방/지갑', keyword: '남성 가방 지갑' },
        { label: '잡화: 벨트/모자', keyword: '남성 벨트 모자' },
        { label: '잡화: 넥타이/양말', keyword: '남성 넥타이 양말' },
      ]},
      { label: '남녀공용 의류', items: [
        { label: '맨투맨/후드', keyword: '공용 맨투맨 후드티' },
        { label: '기본 티셔츠', keyword: '공용 무지 반팔티' },
        { label: '트레이닝복', keyword: '조거팬츠 트레이닝 세트' },
        { label: '바람막이/점퍼', keyword: '공용 바람막이 점퍼' },
      ]},
      { label: '속옷/잠옷', items: [
        { label: '여성 속옷', keyword: '브라 팬티 세트' },
        { label: '남성 속옷', keyword: '남성 드로즈 사각팬티' },
        { label: '홈웨어/잠옷', keyword: '커플 파자마 수면잠옷' },
        { label: '보정속옷', keyword: '보정 브라 거들' },
      ]},
      { label: '패션잡화', items: [
        { label: '시계/주얼리', keyword: '패션 시계 팔찌' },
        { label: '선글라스/안경', keyword: '선글라스 패션안경' },
        { label: '헤어액세서리', keyword: '헤어핀 머리끈' },
        { label: '우산/양산', keyword: '자동 우산 양산' },
      ]}
    ]},
    { label: '뷰티/헬스', icon: Heart, subs: [
      { label: '스킨케어', items: [
        { label: '토너/에센스', keyword: '토너 에센스' },
        { label: '크림/로션', keyword: '수분 크림 로션' },
        { label: '클렌징/필링', keyword: '클렌징 폼 필링젤' },
        { label: '마스크팩/시트', keyword: '마스크팩 시트팩' },
        { label: '선케어', keyword: '선크림 자외선차단제' },
      ]},
      { label: '메이크업', items: [
        { label: '베이스/파운데이션', keyword: '쿠션 파운데이션' },
        { label: '립메이크업', keyword: '립스틱 립틴트' },
        { label: '아이메이크업', keyword: '아이섀도우 마스카라' },
        { label: '네일케어', keyword: '네일 폴리쉬 큐티클' },
      ]},
      { label: '바디케어', items: [
        { label: '바디로션/크림', keyword: '바디 로션 크림' },
        { label: '입욕제/바디워시', keyword: '입욕제 바디워시' },
        { label: '핸드크림/풋크림', keyword: '핸드크림 풋크림' },
        { label: '제모/왁싱', keyword: '제모기 왁싱' },
      ]},
      { label: '헤어케어', items: [
        { label: '샴푸/린스', keyword: '샴푸 트리트먼트' },
        { label: '헤어에센스/오일', keyword: '헤어 에센스 오일' },
        { label: '스타일링', keyword: '헤어 왁스 스프레이' },
        { label: '염색/탈색', keyword: '헤어 염색약' },
      ]},
      { label: '건강식품', items: [
        { label: '비타민/미네랄', keyword: '종합비타민 영양제' },
        { label: '오메가3/유산균', keyword: '오메가3 유산균' },
        { label: '다이어트보조제', keyword: '다이어트 보조제' },
        { label: '건강즙/분말', keyword: '건강즙 효소분말' },
      ]}
    ]},
    { label: '주방/생활', icon: UtensilsCrossed, subs: [
      { label: '주방조리도구', items: [
        { label: '칼/도마/가위', keyword: '주방칼 도마 가위' },
        { label: '계량도구/믹싱볼', keyword: '계량컵 믹싱볼' },
        { label: '조리도구세트', keyword: '실리콘 조리도구 세트' },
        { label: '국자/뒤집개', keyword: '국자 뒤집개' },
        { label: '필러/강판', keyword: '필러 강판 슬라이서' },
      ]},
      { label: '냄비/프라이팬', items: [
        { label: '프라이팬', keyword: '인덕션 프라이팬' },
        { label: '냄비/찜기', keyword: '스텐 냄비 찜기' },
        { label: '전골/뚝배기', keyword: '전골냄비 뚝배기' },
        { label: '압력솥/밥솥', keyword: '압력솥 밥솥' },
      ]},
      { label: '식기/컵', items: [
        { label: '접시/볼', keyword: '플레이팅 접시 그릇' },
        { label: '텀블러/물병', keyword: '스텐 텀블러 보온병' },
        { label: '머그/유리컵', keyword: '머그컵 유리컵' },
        { label: '수저/젓가락', keyword: '수저세트 젓가락' },
      ]},
      { label: '보관/밀폐', items: [
        { label: '밀폐용기/반찬통', keyword: '밀폐용기 반찬통' },
        { label: '지퍼백/랩', keyword: '지퍼백 실리콘랩' },
        { label: '김치통/장류통', keyword: '김치통 장류통' },
      ]},
      { label: '청소/세탁', items: [
        { label: '청소도구', keyword: '밀대 걸레 청소포' },
        { label: '빨래건조대', keyword: '빨래건조대 옷걸이' },
        { label: '세제/세정제', keyword: '주방세제 세탁세제' },
        { label: '쓰레기통/분리수거', keyword: '쓰레기통 분리수거함' },
      ]},
      { label: '욕실용품', items: [
        { label: '샤워기/수전', keyword: '샤워기 헤드 수전' },
        { label: '욕실수납/정리', keyword: '욕실선반 수납함' },
        { label: '욕실매트/발판', keyword: '욕실매트 미끄럼방지' },
        { label: '칫솔/치약/면도', keyword: '칫솔 치약 면도기' },
      ]},
      { label: '생활잡화', items: [
        { label: '디퓨저/방향제', keyword: '디퓨저 실내방향제' },
        { label: '방충/방서', keyword: '모기퇴치 바퀴벌레약' },
        { label: '건전지/접착용품', keyword: '건전지 접착테이프' },
        { label: '우산/우비', keyword: '장우산 우비' },
      ]}
    ]},
    { label: '가전/디지털', icon: Cpu, subs: [
      { label: '주방가전', items: [
        { label: '에어프라이어', keyword: '에어프라이어' },
        { label: '전자레인지/오븐', keyword: '전자레인지 오븐' },
        { label: '커피메이커/포트', keyword: '커피메이커 전기포트' },
        { label: '믹서/블렌더', keyword: '믹서기 블렌더' },
        { label: '토스터/샌드위치메이커', keyword: '토스터 샌드위치메이커' },
        { label: '정수기/얼음정수기', keyword: '정수기 얼음정수기' },
      ]},
      { label: '생활가전', items: [
        { label: '청소기', keyword: '무선청소기 진공청소기' },
        { label: '공기청정기', keyword: '공기청정기' },
        { label: '가습기/제습기', keyword: '가습기 제습기' },
        { label: '선풍기/서큘레이터', keyword: '선풍기 서큘레이터' },
        { label: '전기히터/온풍기', keyword: '전기히터 온풍기' },
      ]},
      { label: '이미용가전', items: [
        { label: '헤어드라이기', keyword: '헤어드라이기' },
        { label: '고데기/매직기', keyword: '고데기 매직기' },
        { label: '전동칫솔/워터픽', keyword: '전동칫솔 워터픽' },
        { label: '면도기/제모기', keyword: '전기면도기 제모기' },
        { label: '미용기기', keyword: '피부마사지기 LED마스크' },
      ]},
      { label: 'PC주변기기', items: [
        { label: '마우스/키보드', keyword: '무선마우스 키보드' },
        { label: 'USB/저장장치', keyword: 'USB 외장하드' },
        { label: '모니터받침대/암', keyword: '모니터받침대 암' },
        { label: 'PC청소/관리', keyword: 'PC청소 쿨링팬' },
      ]},
      { label: '휴대폰액세서리', items: [
        { label: '케이스/범퍼', keyword: '핸드폰케이스 범퍼' },
        { label: '보호필름/강화유리', keyword: '액정보호필름 강화유리' },
        { label: '충전기/케이블', keyword: '휴대폰충전기 케이블' },
        { label: '거치대/그립톡', keyword: '핸드폰거치대 그립톡' },
      ]},
      { label: '음향기기', items: [
        { label: '이어폰/헤드폰', keyword: '블루투스이어폰 헤드폰' },
        { label: '스피커', keyword: '블루투스스피커' },
        { label: '마이크/녹음기', keyword: '무선마이크 녹음기' },
      ]}
    ]},
    { label: '가구/인테리어', icon: Sofa, subs: [
      { label: '침실가구', items: [
        { label: '침대/매트리스', keyword: '침대 매트리스' },
        { label: '베개/쿠션', keyword: '경추베개 쿠션' },
        { label: '이불/이불커버', keyword: '이불 이불커버' },
        { label: '매트리스커버/패드', keyword: '매트리스커버 패드' },
        { label: '블라인드/커튼', keyword: '블라인드 암막커튼' },
      ]},
      { label: '거실가구', items: [
        { label: '소파/쇼파', keyword: '소파 패브릭소파' },
        { label: '거실테이블', keyword: '거실테이블 좌탁' },
        { label: 'TV장/거실장', keyword: 'TV장 거실장' },
        { label: '러그/카펫', keyword: '러그 카펫' },
      ]},
      { label: '수납가구', items: [
        { label: '옷장/행거', keyword: '옷장 행거' },
        { label: '서랍장/수납장', keyword: '서랍장 수납장' },
        { label: '책장/선반', keyword: '책장 선반' },
        { label: '수납박스/바구니', keyword: '수납박스 폴딩박스' },
      ]},
      { label: '의자/책상', items: [
        { label: '사무의자/게이밍의자', keyword: '사무의자 게이밍의자' },
        { label: '책상/컴퓨터책상', keyword: '책상 컴퓨터책상' },
        { label: '식탁의자', keyword: '식탁의자 의자' },
        { label: '좌식의자/방석', keyword: '좌식의자 방석' },
      ]},
      { label: '조명/인테리어소품', items: [
        { label: 'LED조명/무드등', keyword: 'LED조명 무드등' },
        { label: '스탠드/테이블조명', keyword: '스탠드 테이블조명' },
        { label: '벽시계/탁상시계', keyword: '벽시계 탁상시계' },
        { label: '액자/포스터', keyword: '액자 인테리어포스터' },
        { label: '거울/화장대', keyword: '전신거울 화장대' },
      ]},
      { label: '셀프인테리어', items: [
        { label: '벽지/시트지', keyword: '셀프벽지 시트지' },
        { label: '몰딩/우드타일', keyword: '몰딩 우드타일' },
        { label: '접착식선반', keyword: '무타공선반 접착선반' },
      ]}
    ]},
    { label: '스포츠/레저', icon: Tent, subs: [
      { label: '캠핑용품', items: [
        { label: '텐트/타프', keyword: '캠핑텐트 타프' },
        { label: '침낭/매트', keyword: '침낭 캠핑매트' },
        { label: '캠핑의자/테이블', keyword: '캠핑의자 폴딩테이블' },
        { label: '버너/코펠/쿨러', keyword: '캠핑버너 코펠 쿨러' },
        { label: '랜턴/조명', keyword: '캠핑랜턴 LED조명' },
        { label: '화로대/그릴', keyword: '화로대 캠핑그릴' },
      ]},
      { label: '등산용품', items: [
        { label: '등산스틱/트레킹화', keyword: '등산스틱 트레킹화' },
        { label: '등산가방/배낭', keyword: '등산가방 백팩' },
        { label: '등산복/기능성의류', keyword: '등산복 기능성티' },
        { label: '보호대/아대', keyword: '무릎보호대 손목아대' },
      ]},
      { label: '낚시용품', items: [
        { label: '낚시대/릴', keyword: '낚시대 릴' },
        { label: '낚시의자/받침대', keyword: '낚시의자 받침대' },
        { label: '쿨러/보관함', keyword: '낚시쿨러 태클박스' },
        { label: '루어/미끼', keyword: '낚시루어 미끼' },
      ]},
      { label: '홈트레이닝', items: [
        { label: '요가매트/밴드', keyword: '요가매트 밴드' },
        { label: '덤벨/아령/케틀벨', keyword: '덤벨 아령 케틀벨' },
        { label: '폼롤러/마사지볼', keyword: '폼롤러 마사지볼' },
        { label: '풀업바/푸쉬업바', keyword: '풀업바 푸쉬업바' },
        { label: '런닝머신/실내자전거', keyword: '런닝머신 실내자전거' },
      ]},
      { label: '스포츠의류/용품', items: [
        { label: '운동복/레깅스', keyword: '운동복 레깅스' },
        { label: '운동화/런닝화', keyword: '운동화 런닝화' },
        { label: '스포츠가방', keyword: '스포츠가방 짐백' },
        { label: '수영복/수경/수모', keyword: '수영복 수경 수모' },
      ]}
    ]},
    { label: '유아동/출산', icon: Baby, subs: [
      { label: '기저귀/물티슈', items: [
        { label: '기저귀/밴드', keyword: '기저귀 밴드형' },
        { label: '물티슈/아기티슈', keyword: '물티슈 아기물티슈' },
        { label: '기저귀가방/매트', keyword: '기저귀가방 매트' },
      ]},
      { label: '분유/이유식', items: [
        { label: '분유/조제분유', keyword: '분유 조제분유' },
        { label: '이유식/간식', keyword: '이유식 아기간식' },
        { label: '젖병/젖꼭지', keyword: '젖병 젖꼭지' },
        { label: '유아식기/컵', keyword: '유아식기 빨대컵' },
      ]},
      { label: '유아의류', items: [
        { label: '바디슈트/우주복', keyword: '아기바디슈트 우주복' },
        { label: '상하복세트', keyword: '유아상하복' },
        { label: '아기외출복', keyword: '아기외출복 점퍼' },
        { label: '유아신발/양말', keyword: '아기신발 양말' },
      ]},
      { label: '목욕/위생', items: [
        { label: '아기욕조/목욕용품', keyword: '아기욕조 목욕용품' },
        { label: '샴푸/로션', keyword: '아기샴푸 로션' },
        { label: '구강/손톱관리', keyword: '유아칫솔 손톱깎이' },
      ]},
      { label: '외출용품', items: [
        { label: '유모차/웨건', keyword: '유모차 웨건' },
        { label: '아기띠/힙시트', keyword: '아기띠 힙시트' },
        { label: '카시트', keyword: '카시트' },
      ]},
      { label: '완구/교구', items: [
        { label: '블록/쌓기놀이', keyword: '블록 쌓기놀이' },
        { label: '인형/피규어', keyword: '인형 피규어' },
        { label: '악기/음악완구', keyword: '장난감악기 음악완구' },
        { label: '학습교구', keyword: '학습교구 한글교구' },
      ]}
    ]},
    { label: '반려동물', icon: PawPrint, subs: [
      { label: '사료/간식', items: [
        { label: '강아지사료', keyword: '강아지사료 건사료' },
        { label: '고양이사료', keyword: '고양이사료 캣푸드' },
        { label: '반려동물간식', keyword: '강아지간식 고양이간식' },
        { label: '영양제/보조제', keyword: '반려동물영양제' },
      ]},
      { label: '위생/배변', items: [
        { label: '배변패드/모래', keyword: '배변패드 고양이모래' },
        { label: '화장실/스쿱', keyword: '고양이화장실 스쿱' },
        { label: '샴푸/목욕', keyword: '반려동물샴푸 목욕용품' },
        { label: '이동가방/케이지', keyword: '이동가방 케이지' },
      ]},
      { label: '의류/액세서리', items: [
        { label: '반려동물의류', keyword: '강아지옷 고양이옷' },
        { label: '목줄/리드줄', keyword: '목줄 리드줄' },
        { label: '인식표/목걸이', keyword: '인식표 반려동물목걸이' },
      ]},
      { label: '장난감/훈련', items: [
        { label: '장난감/공', keyword: '강아지장난감 공' },
        { label: '캣타워/스크래쳐', keyword: '캣타워 스크래쳐' },
        { label: '훈련용품', keyword: '배변훈련 클리커' },
      ]},
      { label: '급식기/하우스', items: [
        { label: '식기/급수기', keyword: '반려동물식기 급수기' },
        { label: '자동급식기/정수기', keyword: '자동급식기 정수기' },
        { label: '방석/하우스', keyword: '반려동물방석 하우스' },
      ]}
    ]},
    { label: '식품/건강', icon: Utensils, subs: [
      { label: '간편식/HMR', items: [
        { label: '냉동밥/즉석밥', keyword: '냉동밥 즉석밥' },
        { label: '레토르트/통조림', keyword: '레토르트 통조림' },
        { label: '냉동만두/피자', keyword: '냉동만두 냉동피자' },
        { label: '컵라면/봉지라면', keyword: '컵라면 라면' },
      ]},
      { label: '음료/차/커피', items: [
        { label: '생수/탄산수', keyword: '생수 탄산수' },
        { label: '커피/원두', keyword: '커피 원두 캡슐커피' },
        { label: '녹차/홍차/허브차', keyword: '녹차 홍차 허브차' },
        { label: '음료/주스', keyword: '과일주스 음료' },
      ]},
      { label: '과자/간식', items: [
        { label: '과자/스낵', keyword: '과자 스낵' },
        { label: '초콜릿/캔디', keyword: '초콜릿 사탕' },
        { label: '견과류/건과일', keyword: '견과류 건과일' },
        { label: '젤리/껌', keyword: '젤리 껌' },
      ]},
      { label: '건강식품', items: [
        { label: '홍삼/인삼', keyword: '홍삼 인삼' },
        { label: '프로폴리스/꿀', keyword: '프로폴리스 꿀' },
        { label: '다이어트식품', keyword: '다이어트쉐이크 식단' },
        { label: '단백질보충제', keyword: '단백질보충제 프로틴' },
      ]},
      { label: '양념/오일/소스', items: [
        { label: '식용유/올리브유', keyword: '식용유 올리브유' },
        { label: '간장/고추장/된장', keyword: '간장 고추장 된장' },
        { label: '소금/설탕/조미료', keyword: '소금 설탕 조미료' },
        { label: '소스/드레싱', keyword: '소스 드레싱' },
      ]}
    ]},
    { label: '문구/취미', icon: Book, subs: [
      { label: '필기구', items: [
        { label: '볼펜/샤프', keyword: '볼펜 샤프' },
        { label: '형광펜/마카', keyword: '형광펜 마카' },
        { label: '연필/색연필', keyword: '연필 색연필' },
        { label: '만년필/잉크', keyword: '만년필 잉크' },
      ]},
      { label: '노트/수첩', items: [
        { label: '공책/노트', keyword: '공책 노트' },
        { label: '다이어리/플래너', keyword: '다이어리 플래너' },
        { label: '포스트잇/메모지', keyword: '포스트잇 메모지' },
        { label: '바인더/파일', keyword: '바인더 파일철' },
      ]},
      { label: '사무용품', items: [
        { label: '계산기/타이머', keyword: '계산기 타이머' },
        { label: '테이프/풀/가위', keyword: '테이프 풀 가위' },
        { label: '스테이플러/펀치', keyword: '스테이플러 펀치' },
        { label: '클립/압정', keyword: '클립 압정' },
      ]},
      { label: '화방용품', items: [
        { label: '스케치북/도화지', keyword: '스케치북 도화지' },
        { label: '물감/붓', keyword: '물감 붓' },
        { label: '크레파스/파스텔', keyword: '크레파스 파스텔' },
        { label: '캔버스/이젤', keyword: '캔버스 이젤' },
      ]},
      { label: 'DIY/공예', items: [
        { label: '비즈/구슬공예', keyword: '비즈 구슬공예' },
        { label: '클레이/점토', keyword: '클레이 점토' },
        { label: '십자수/자수', keyword: '십자수 자수' },
        { label: '레진/목공예', keyword: '레진 목공예' },
      ]},
      { label: '악기', items: [
        { label: '우쿨렐레/기타', keyword: '우쿨렐레 기타' },
        { label: '키보드/신디사이저', keyword: '키보드 신디사이저' },
        { label: '칼림바/오카리나', keyword: '칼림바 오카리나' },
        { label: '하모니카/리코더', keyword: '하모니카 리코더' },
      ]}
    ]},
    { label: '자동차용품', icon: Car, subs: [
      { label: '인테리어', items: [
        { label: '방향제/디퓨저', keyword: '차량용방향제 디퓨저' },
        { label: '시트커버/쿠션', keyword: '시트커버 차량쿠션' },
        { label: '핸들커버', keyword: '핸들커버' },
        { label: '햇빛가리개/커튼', keyword: '햇빛가리개 차량커튼' },
      ]},
      { label: '편의용품', items: [
        { label: '휴대폰거치대', keyword: '차량용거치대' },
        { label: '충전기/시거잭', keyword: '차량용충전기 시거잭' },
        { label: '수납함/정리함', keyword: '차량수납함 트렁크정리함' },
        { label: '음료수거치대', keyword: '컵홀더 음료거치대' },
      ]},
      { label: '세차/관리', items: [
        { label: '세차용품', keyword: '세차타월 세차용품' },
        { label: '광택제/왁스', keyword: '광택제 왁스' },
        { label: '유리세정제', keyword: '유리세정제 발수코팅' },
        { label: '진공청소기', keyword: '차량청소기' },
      ]},
      { label: '안전용품', items: [
        { label: '블랙박스', keyword: '블랙박스' },
        { label: '공기청정기', keyword: '차량공기청정기' },
        { label: '타이어/공구', keyword: '타이어체인 비상공구' },
      ]}
    ]}
  ];


  const handleCategorySearch = (subLabel: string, keyword: string) => {
    setActiveCategory(subLabel);
    const firstKeyword = keyword.split(' ')[0];
    setKeyword(firstKeyword);
    handleSearchWithKeyword(firstKeyword);
  };

  const displayProducts = [...products]
    .filter(p => gradeFilter === 'all' || p.calculated.grade === gradeFilter)
    .sort((a, b) => {
      if (sortBy === 'productPrice') return a.productPrice - b.productPrice;
      if (sortBy === 'competitionStrength') return a.calculated.competitionStrength - b.calculated.competitionStrength;
      return (b.calculated as any)[sortBy] - (a.calculated as any)[sortBy];
    });

  const handleExportCSV = () => {
    const headers = ['상품명', '가격', '소싱지수', '등급', '쿠팡링크'];
    const rows = displayProducts.map(p => [
      `"${p.productName.replace(/"/g, '""')}"`,
      p.productPrice,
      p.calculated.sourcingScore,
      p.calculated.grade,
      p.productUrl,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `소싱분석_${keyword}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;
    setActiveCategory(null);
    await handleSearchWithKeyword(keyword.trim());
  };

  const handleSearchWithKeyword = async (kw: string) => {
    setLoading(true);
    setSearchError(null);
    try {
      const query = new URLSearchParams({ keyword: kw, minPrice, maxPrice });
      const response = await fetch(`/api/coupang?${query.toString()}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        setSearchError({ message: data.error || '검색 실패' });
        setProducts([]);
        setKeywordStats(null);
        return;
      }
      setProducts(data);

      const total = Math.min(data.length, 20);
      const topProducts = data.slice(0, total);
      const rocket = topProducts.filter((p: Product) => p.deliveryType === 'rocket' || (p.isRocket && !p.deliveryType)).length;
      const jet = topProducts.filter((p: Product) => p.deliveryType === 'jet').length;
      const general = topProducts.filter((p: Product) => p.deliveryType === 'general' || (!p.isRocket && !p.deliveryType)).length;

      const rocketPct = (rocket / total) * 100;
      const jetPct = (jet / total) * 100;
      const generalPct = (general / total) * 100;

      const sellerDist = JSON.stringify({ rocketPct, jetPct, generalPct });

      const statsRes = await fetch(`/api/keyword-stats?keyword=${kw}&sellerDistribution=${encodeURIComponent(sellerDist)}`);
      const statsData = await statsRes.json();
      setKeywordStats(statsData);

    } catch (error: any) {
      setSearchError({ message: error.message });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getGradeStyle = (grade: 'Excellent' | 'Good' | 'Fair' | 'Bad') => {
    if (grade === 'Excellent') return 'text-emerald-400 bg-emerald-50 ring-emerald-500/20';
    if (grade === 'Good') return 'text-indigo-400 bg-indigo-50 ring-indigo-500/20';
    if (grade === 'Fair') return 'text-amber-400 bg-amber-50 ring-amber-500/20';
    return 'text-rose-400 bg-rose-50 ring-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Header */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/70 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              훈프로 <span className="text-indigo-600">소싱 파인더</span>
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col gap-8 bg-white">
        
        {/* Feature 5: Today's Golden Keywords */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-5 px-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-200/50"><Sparkles className="w-5 h-5 text-white" /></div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">오늘의 <span className="text-amber-500">훈프로 키워드</span></h3>
                 </div>
                 <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent mx-4" />
                 <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Blue Ocean Discovery</p>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-2">
                 {goldenKeywords.length > 0 ? goldenKeywords.map((g, idx) => (
                    <button key={idx} onClick={() => { setKeyword(g.keyword); handleSearchWithKeyword(g.keyword); }} className="flex-shrink-0 min-w-[280px] max-w-[320px] bg-white border-2 border-slate-200 hover:border-amber-400/50 p-4 rounded-[24px] flex items-center justify-between transition-all group active:scale-95 shadow-sm">
                       <div className="text-left flex-1 pr-4 overflow-hidden">
                          <p className="text-sm font-black text-slate-800 group-hover:text-amber-400 transition-colors uppercase truncate">{g.keyword}</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5 tracking-tight truncate">{g.category}</p>
                       </div>
                       <div className="flex flex-col items-end ml-3 flex-shrink-0">
                          <span className="text-[9px] font-black text-amber-500">{g.hotIndex}%</span>
                          <div className="w-7 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${g.hotIndex}%` }} /></div>
                       </div>
                    </button>
                 )) : [1,2,3,4,5,6].map(i => <div key={i} className="w-[280px] h-16 bg-slate-100 animate-pulse rounded-[24px]" />)}
              </div>
        </motion.div>

        {/* Global Control Bar */}
        <div className="sticky top-[64px] z-30 flex flex-col gap-4 bg-white/80 backdrop-blur-md pb-4 pt-2">
           <div className="bg-white rounded-[28px] p-3 border border-slate-200 shadow-sm overflow-hidden flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 border-r border-slate-200 pr-6 shrink-0">
                 <Sparkles className="w-4 h-4 text-emerald-500" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">카테고리</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                 {CATEGORIES.map((cat) => (
                    <div key={cat.label} className="relative group/cat shrink-0">
                       <button 
                          onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${expandedCategory === cat.label ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                       >
                          <cat.icon className="w-3.5 h-3.5" />
                          {cat.label}
                       </button>
                       <AnimatePresence>
                          {expandedCategory === cat.label && (
                             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed top-[260px] left-8 right-8 z-40 bg-white/95 backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl border border-slate-200 ring-1 ring-slate-200/50 max-h-[60vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                                   <div className="flex items-center gap-2 text-indigo-600 font-black text-lg"><cat.icon className="w-6 h-6" />{cat.label} 하위 분류</div>
                                   <button onClick={() => setExpandedCategory(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                   {cat.subs.map(sub => (
                                      <div key={sub.label} className="space-y-4">
                                         <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50">{sub.label}</h4>
                                         <div className="flex flex-col gap-2">
                                            {sub.items.map(item => (
                                               <button 
                                                  key={item.label} 
                                                  onClick={() => { handleCategorySearch(item.label, item.keyword); setExpandedCategory(null); }}
                                                  className={`text-left py-2 px-3 rounded-xl text-[12px] font-bold transition-all ${activeCategory === item.label ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}
                                               >
                                                  ▸ {item.label}
                                                </button>
                                            ))}
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-[32px] p-4 border-2 border-indigo-100 shadow-xl flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="공략할 상품 키워드를 입력하세요..."
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl outline-none text-sm font-bold shadow-inner focus:ring-2 ring-indigo-500/20 transition-all text-slate-900"
                />
              </div>
              <button 
                onClick={() => handleSearch()}
                disabled={loading} 
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                소싱 제품 찾기
              </button>
              
              {!loading && products.length > 0 && (
                <button 
                  onClick={handleExportCSV}
                  className="p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all shadow-lg active:scale-95"
                  title="엑셀로 저장"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
           </div>
        </div>

          <AnimatePresence>
            {!loading && keywordStats && products.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-indigo-50 rounded-2xl"><TrendingUp className="w-6 h-6 text-indigo-400" /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">{keywordStats.keyword} <span className="text-slate-500 font-bold ml-2">시장성 분석</span></h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Market Insight Analytics</p>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded-md border border-indigo-500/20">{keywordStats.marketTrend}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* 월간 검색수 그래프 - 전체 너비 */}
                    {keywordStats.trendData && (
                      <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-amber-400">월간 검색량 추이</p>
                        <Sparkline data={keywordStats.trendData} />
                      </div>
                    )}

                    {/* 나머지 지표들 */}
                    <div className="grid grid-cols-4 gap-6">
                      <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">총 등록 상품</p>
                        <p className="text-2xl font-black text-blue-400">{keywordStats.totalProducts.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">▸ 수집된 실시간 데이터</p>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">경쟁 강도</p>
                        <p className={`text-2xl font-black ${keywordStats.competitionRate < 5.0 ? 'text-emerald-400' : keywordStats.competitionRate < 15.0 ? 'text-indigo-400' : 'text-rose-400'}`}>{keywordStats.competitionRate}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">▸ {keywordStats.competitionRate < 5.0 ? '블루오션 (강력추천)' : keywordStats.competitionRate < 15.0 ? '양호한 시장 (추천)' : '레드오션 (진입주의)'}</p>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">평균 객단가</p>
                        <p className="text-2xl font-black text-amber-400">{keywordStats.averagePrice.toLocaleString()}원</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">▸ {keywordStats.minPrice.toLocaleString()} ~ {keywordStats.maxPrice.toLocaleString()} (범위)</p>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                        <SellerLandscape products={products} />
                      </div>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && products.length > 0 && (
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                {(['all', 'Excellent', 'Good', 'Fair', 'Bad'] as const).map(g => (
                  <button key={g} onClick={() => setGradeFilter(g)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${gradeFilter === g ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>{g}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
            {loading ? (
              <div className="grid grid-cols-3 gap-6">{Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}</div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                <AnimatePresence>
                  {displayProducts.map((product, index) => (
                    <motion.div key={product.productId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        <img src={product.productImage} alt={product.productName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ring-1 ${getGradeStyle(product.calculated.grade)}`}>{product.calculated.grade}</div>
                          {product.deliveryType === 'rocket' && (
                            <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase shadow-sm">로켓</div>
                          )}
                          {product.deliveryType === 'jet' && (
                            <div className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded uppercase shadow-sm">판매자로켓</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-[14px] text-slate-900 line-clamp-2 mb-4 h-10 leading-snug">{product.productName}</h3>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-black text-indigo-600">{product.productPrice.toLocaleString()}원</span>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto">
                          <div className="flex gap-2">
                             <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"><ExternalLink className="w-3 h-3" />링크</a>
                             <button
                                onClick={() => {
                                   setSelectedProduct(product);
                                   setIsDrawerOpen(true);
                                   setWholesalePrice(0);
                                }}
                                className="flex-[2] py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                             >
                               <LayoutDashboard className="w-3 h-3" />
                               소싱 분석
                             </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Search className="w-16 h-16 mb-6 opacity-20" />
                <h2 className="text-xl font-bold">분석을 시작해보세요</h2>
              </div>
            )}
          </div>

          {/* Drawer */}
          <AnimatePresence>
            {isDrawerOpen && selectedProduct && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm cursor-pointer" />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-[450px] bg-white z-[60] shadow-2xl flex flex-col">
                  <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                    <div><h2 className="text-xl font-bold text-slate-800">소싱 수익성 분석</h2></div>
                    <button onClick={() => setIsDrawerOpen(false)}><ChevronRight className="w-6 h-6 text-slate-600" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                    <div className="flex gap-6 items-start border-t border-slate-200 pt-10">
                      <img src={selectedProduct.productImage} className="w-20 h-20 rounded-2xl object-cover border shadow-sm" alt="" />
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 mb-2 leading-tight text-slate-800">{selectedProduct.productName}</h3>
                        <p className="text-sm font-bold text-slate-600">현재 쿠팡가: {selectedProduct.productPrice.toLocaleString()}원</p>
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-dashed border-slate-200">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">수익 시뮬레이션</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase text-center">판매 매입가 (위안)</label>
                          <input
                            type="number"
                            placeholder="예: 25.5"
                            onChange={(e) => setWholesalePrice(Math.round(Number(e.target.value) * sourcingMultiplier))}
                            className="text-center w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase text-center">소싱 배수(환율/관세)</label>
                          <input
                            type="number"
                            value={sourcingMultiplier}
                            onChange={(e) => handleMultiplierChange(Number(e.target.value))}
                            className="text-center w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-200">
                        <span className="text-xs font-bold text-slate-500">예상 원가(합계)</span>
                        <span className="text-sm font-black text-indigo-600">{wholesalePrice.toLocaleString()}원</span>
                      </div>

                      <div className={`p-8 rounded-[32px] border-2 ${margin > 20 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-6">
                           <span className="text-sm font-bold text-slate-500">예상 마진율</span>
                           <span className="text-3xl font-black text-emerald-600">{margin.toFixed(1)}%</span>
                        </div>
                        <div className="pt-6 flex justify-between items-center border-t border-dashed border-slate-200">
                           <span className="font-bold text-lg text-slate-800">최종 수익</span>
                           <span className={`text-2xl font-black ${profit > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{profit.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-200">
                    <button onClick={() => setIsDrawerOpen(false)} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl">분석 완료</button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-slate-200 bg-white/70 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto px-6 py-6 flex items-center justify-center gap-6">
            <a
              href="https://hoonpro.liveklass.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-sm font-bold text-slate-600"
            >
              <ExternalLink className="w-4 h-4" />
              링크트리 홈페이지
            </a>
            <a
              href="https://www.youtube.com/@saupsin89"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-sm font-bold text-slate-600"
            >
              <ExternalLink className="w-4 h-4" />
              링크트리 유튜브
            </a>
          </div>
        </footer>
    </div>
  );
}
