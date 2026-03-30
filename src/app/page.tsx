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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductSkeleton } from '@/components/Skeleton';

const Sparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 35 - ((val - min) / range) * 30; // 35 height, scale to 30
    return `${x},${y}`;
  }).join(' ');

  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <div className="w-full flex flex-col pt-1">
      <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 35">
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M 0 35 L ${points} L 100 35 Z`} fill="url(#sparkGradient)" />
        <polyline
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]"
          points={points}
        />
      </svg>
      <div className="flex justify-between px-0.5 mt-1.5 border-t border-slate-700/30 pt-1">
        {months.map((m, i) => (
          <span key={i} className="text-[7.5px] font-black text-slate-300 tabular-nums">
            {m}
          </span>
        ))}
      </div>
      <p className="text-[7.5px] font-black text-slate-400 text-center mt-0.5 uppercase tracking-tighter">Growth Seasonality (Jan - Dec)</p>
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
        <div style={{ width: `${jetPct}%` }} className="h-full bg-amber-500 transition-all duration-500" title={`그로우스: ${jet}`} />
        <div style={{ width: `${generalPct}%` }} className="h-full bg-emerald-500 transition-all duration-500" title={`일반배송: ${general}`} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-rose-400 uppercase">로켓</span>
          <span className="text-sm font-black text-slate-800">{Math.round(rocketPct)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-amber-400 uppercase">그로우스</span>
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
        { label: '신발: 스니커즈/로퍼', keyword: '여성 운동화 로퍼' },
        { label: '신발: 힐/샌들', keyword: '여성 구두 샌들' },
        { label: '가방: 핸드백/숄더백', keyword: '여성 핸드백 숄더백' },
        { label: '가방: 백팩/에코백', keyword: '여성 백팩 에코백' },
        { label: '잡화: 모자/벨트', keyword: '여성 모자 벨트' },
        { label: '잡화: 양말/스타킹', keyword: '여성 양말 스타킹' },
      ]},
      { label: '남성패션', items: [
        { label: '의류: 티셔츠/셔츠', keyword: '남성 반팔 셔츠' },
        { label: '의류: 팬츠/청바지', keyword: '남성 슬랙스 청바지' },
        { label: '의류: 아우터', keyword: '남성 자켓 점퍼' },
        { label: '신발: 운동화/구두', keyword: '남성 스니커즈 정장구두' },
        { label: '잡화: 가방/지갑', keyword: '남성 가방 지갑' },
        { label: '잡화: 벨트/모자', keyword: '남성 벨트 모자' },
      ]},
      { label: '남녀공용 의류', items: [
        { label: '맨투맨/후드', keyword: '공용 맨투맨 후드티' },
        { label: '기본 티셔츠', keyword: '공용 무지 반팔티' },
        { label: '트레이닝복', keyword: '조거팬츠 트레이닝 세트' },
      ]},
      { label: '속옷/잠옷', items: [
        { label: '여성 속옷', keyword: '브라 팬티 세트' },
        { label: '남성 속옷', keyword: '남성 드로즈 사각팬티' },
        { label: '홈웨어/잠옷', keyword: '커플 파자마 수면잠옷' },
      ]},
      { label: '유아동패션', items: [
        { label: '베이비 의류', keyword: '아기 바디슈트' },
        { label: '키즈 의류', keyword: '아동 상하복' },
        { label: '아동 신발', keyword: '아동 운동화 실내화' },
      ]},
      { label: '럭셔리패션', items: [
        { label: '명품 가방', keyword: '명품 핸드백' },
        { label: '명품 신발', keyword: '명품 스니커즈' },
        { label: '명품 지갑', keyword: '명품 카드홀더' },
      ]}
    ]},
    { label: '주방/생활', icon: UtensilsCrossed, subs: [
      { label: '주방용품', items: [
        { label: '텀블러/물병', keyword: '스텐 텀블러 보온병' },
        { label: '식기세트/그릇', keyword: '플레이팅 접시 세트' },
        { label: '조리도구/정리', keyword: '실리콘 조리도구 세트' },
        { label: '프라이팬/냄비', keyword: '인덕션용 프라이팬' },
      ]},
      { label: '생활용품', items: [
        { label: '청소/세탁건조', keyword: '건조대 청소포 밀대' },
        { label: '욕실/바디', keyword: '욕실화 샤워기 헤드' },
        { label: '디퓨저/방향제', keyword: '디퓨저 실내 방향제' },
      ]}
    ]},
    { label: '가전/디지털', icon: Cpu, subs: [
      { label: '소형가전', items: [
        { label: '주방가전', keyword: '에어프라이어 믹서기 정수기' },
        { label: '생활/계절가전', keyword: '가습기 공기청정기 가습기' },
        { label: '이미용가전', keyword: '드라이기 전동칫솔 매직기' },
      ]},
      { label: 'IT/디지털', items: [
        { label: '이어폰/헤드셋', keyword: '블루투스 이어폰 수신기' },
        { label: 'PC주변기기', keyword: '버티컬 마우스 키보드' },
        { label: '태블릿/폰 잡화', keyword: '태블릿 거치대 파우치' },
      ]}
    ]},
    { label: '가구/인테리어', icon: Sofa, subs: [
      { label: '수납/홈데코', items: [
        { label: '수납함/선반', keyword: '폴딩박스 무타공 선반' },
        { label: '인테리어 소품', keyword: '무드등 벽시계 포스터' },
      ]},
      { label: '침구/패브릭', items: [
        { label: '베개/이불커버', keyword: '경추 베개 알러지방지 이불' },
        { label: '카페트/러그', keyword: '미끄럼방지 러그 발매트' },
      ]}
    ]},
    { label: '스포츠/레저', icon: Tent, subs: [
      { label: '캠핑용품', items: [
        { label: '캠핑 가구/의자', keyword: '경량 체어 폴딩 테이블' },
        { label: '취사용품/그릴', keyword: '캠핑 구리들 화로대' },
        { label: '텐트/소품', keyword: '자충매트 캠핑 무드등' },
      ]},
      { label: '등산/낚시/기타', items: [
        { label: '등산 장비', keyword: '등산 스틱 무릎보호대' },
        { label: '낚시 필수품', keyword: '낚시 의자 로드 케이스' },
        { label: '피트니스/요가', keyword: '폼롤러 요가매트 레깅스' },
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
              애프터프로 <span className="text-indigo-600">소싱 파인더</span>
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
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">오늘의 <span className="text-amber-500">애프터프로 키워드</span></h3>
                 </div>
                 <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent mx-4" />
                 <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Blue Ocean Discovery</p>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-2">
                 {goldenKeywords.length > 0 ? goldenKeywords.map((g, idx) => (
                    <button key={idx} onClick={() => { setKeyword(g.keyword); handleSearchWithKeyword(g.keyword); }} className="flex-shrink-0 w-[200px] bg-white border-2 border-slate-200 hover:border-amber-400/50 p-3.5 rounded-[24px] flex items-center justify-between transition-all group active:scale-95 shadow-sm">
                       <div className="text-left overflow-hidden">
                          <p className="text-sm font-black text-slate-800 truncate group-hover:text-amber-400 transition-colors uppercase">{g.keyword}</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5 tracking-tight">{g.category}</p>
                       </div>
                       <div className="flex flex-col items-end ml-3">
                          <span className="text-[9px] font-black text-amber-500">{g.hotIndex}%</span>
                          <div className="w-7 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${g.hotIndex}%` }} /></div>
                       </div>
                    </button>
                 )) : [1,2,3,4,5,6].map(i => <div key={i} className="w-[200px] h-14 bg-slate-100 animate-pulse rounded-[24px]" />)}
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
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl"><TrendingUp className="w-6 h-6 text-indigo-400" /></div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">{keywordStats.keyword} <span className="text-slate-500 font-bold ml-2">시장성 분석</span></h2>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Market Insight Analytics</p>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded-md border border-indigo-500/20">{keywordStats.marketTrend}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-5 py-2 rounded-full text-xs font-black shadow-lg shadow-indigo-200/50 ${
                    keywordStats.grade === 'Excellent' ? 'bg-emerald-500 text-white' : 
                    keywordStats.grade === 'Good' ? 'bg-indigo-500 text-white' : 
                    keywordStats.grade === 'Fair' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                  }`}>기회 지수: {keywordStats.grade}</div>
                </div>

                <div className="grid grid-cols-4 gap-8">
                    <div className="col-span-1">
                      {[
                        { label: '월간 검색수', val: keywordStats.searchVolume.toLocaleString(), detail: '네이버/쿠팡 추정', color: 'text-amber-400', isTrend: true },
                        { label: '총 등록 상품', val: keywordStats.totalProducts.toLocaleString(), detail: '수집된 실시간 데이터', color: 'text-blue-400' }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-5 rounded-[24px] border border-slate-200 relative overflow-hidden group mb-4 last:mb-0">
                           <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${item.isTrend ? item.color : 'text-slate-500'}`}>{item.label}</p>
                           <p className={`text-2xl font-black ${item.color}`}>{item.val}</p>
                           <p className="text-[10px] text-slate-500 font-bold mt-1">▸ {item.detail}</p>
                           {item.isTrend && keywordStats.trendData && (
                              <div className="absolute bottom-0 left-0 right-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                 <Sparkline data={keywordStats.trendData} />
                              </div>
                           )}
                        </div>
                      ))}
                    </div>

                    <div className="col-span-1">
                       {[
                        { label: '경쟁 강도', val: keywordStats.competitionRate, detail: `${keywordStats.competitionRate < 5.0 ? '블루오션 (강력추천)' : keywordStats.competitionRate < 15.0 ? '양호한 시장 (추천)' : '레드오션 (진입주의)'}`, color: keywordStats.competitionRate < 5.0 ? 'text-emerald-400' : keywordStats.competitionRate < 15.0 ? 'text-indigo-400' : 'text-rose-400' },
                        { label: '평균 객단가', val: `${keywordStats.averagePrice.toLocaleString()}원`, detail: `${keywordStats.minPrice.toLocaleString()} ~ ${keywordStats.maxPrice.toLocaleString()} (범위)`, color: 'text-amber-400' }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-5 rounded-[24px] border border-slate-200 relative overflow-hidden group mb-4 last:mb-0">
                           <p className={`text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500`}>{item.label}</p>
                           <p className={`text-2xl font-black ${item.color}`}>{item.val}</p>
                           <p className="text-[10px] text-slate-500 font-bold mt-1">▸ {item.detail}</p>
                        </div>
                      ))}
                    </div>

                    <div className="col-span-2">
                       <SellerLandscape products={products} />
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
                            <div className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded uppercase shadow-sm">그로스</div>
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
