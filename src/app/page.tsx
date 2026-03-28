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
  ShoppingBag,
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
    <div className="bg-slate-900/40 p-5 rounded-[24px] border border-slate-800 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">판매자 경쟁 지형 (TOP {total})</p>
      </div>
      
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-800">
        <div style={{ width: `${rocketPct}%` }} className="h-full bg-rose-500 transition-all duration-500" title={`로켓: ${rocket}`} />
        <div style={{ width: `${jetPct}%` }} className="h-full bg-amber-500 transition-all duration-500" title={`그로스: ${jet}`} />
        <div style={{ width: `${generalPct}%` }} className="h-full bg-emerald-500 transition-all duration-500" title={`일반배송: ${general}`} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-rose-400 uppercase">로켓</span>
          <span className="text-sm font-black text-white">{Math.round(rocketPct)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-amber-400 uppercase">그로스</span>
          <span className="text-sm font-black text-white">{Math.round(jetPct)}%</span>
        </div>
        <div className="flex flex-col border-l border-slate-700 pl-2">
          <span className="text-[9px] font-black text-emerald-400 uppercase">일반배송</span>
          <span className="text-sm font-black text-white">{Math.round(generalPct)}%</span>
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

  const getAiPriceUrl = (imageUrl: string): string => {
    // AiPrice 서버는 브라우저가 아니므로 쿠팡 CDN에 직접 접근 가능
    // 프록시 없이 원본 이미지 URL을 직접 전달
    return `https://www.aiprice.com/s?db=1688&img_url=${encodeURIComponent(imageUrl)}`;
  };

  const extractCoreKeyword = (productName: string): string => {
    let name = productName;
    name = name.replace(/\b[A-Za-z]{1,3}[\d][\w-]*/g, '');
    name = name.replace(/\d+(\.\d+)?\s*(L|ml|kg|g|cm|mm|m|inch|인치|GB|TB|mAh|W|V|Hz|평|세대|단계|개입|매|층|구|포|개|장|벌|켤레|족)/gi, '');
    name = name.replace(/20\d{2}(년형?|년도|형)?\b/g, '');
    name = name.replace(/\b\d+\b/g, '');
    ['정품','공식','신상품','무료배송','당일배송','로켓배송','최신','신제품','풀세트','패키지','한국정품','국내정품','해외직구','직구','NEW','new','특가'].forEach(w => {
      name = name.replace(new RegExp(w, 'g'), '');
    });
    name = name.replace(/[(\[（][^)\]）]*[)\]）]/g, '');
    name = name.replace(/[^\uAC00-\uD7A3\u0020a-zA-Z]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    const words = name.split(' ').filter(w => w.length >= 2);
    return words.slice(0, 2).join(' ') || productName.split(' ').slice(0, 2).join(' ');
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
    { label: '주방/생활', icon: UtensilsCrossed, subs: [
      { label: '주방용품', items: [
        { label: '텀블러/보온병', keyword: '텀블러 보온병' },
        { label: '식기/그릇', keyword: '그릇 식기세트' },
        { label: '수저세트', keyword: '수저세트 커틀러리' },
        { label: '프라이팬/냄비', keyword: '인덕션프라이팬 냄비세트' },
      ]},
      { label: '생활잡화', items: [
        { label: '우산/양산', keyword: '자동우산 양산겸용' },
        { label: '욕실용품', keyword: '규조토매트 욕실의자' },
        { label: '청소용품', keyword: '무선청소기 밀대걸레' },
        { label: '수납정리', keyword: '리빙박스 정리함' },
      ]}
    ]},
    { label: '가전/디지털', icon: Cpu, subs: [
      { label: '디지털', items: [
        { label: '모바일액세서리', keyword: '아이폰케이스 갤럭시필름' },
        { label: '이어폰/헤드폰', keyword: '무선이어폰 헤드셋' },
        { label: '노트북거치대', keyword: '맥북거치대 쿨링패드' },
      ]},
      { label: '가전', items: [
        { label: '가습기/청정기', keyword: '대용량가습기 공기청정기' },
        { label: '주방가전', keyword: '에어프라이어 와플메이커' },
        { label: '소형가전', keyword: '보풀제거기 핸디선풍기' },
      ]}
    ]},
    { label: '캠핑/아웃도어', icon: Tent, subs: [
      { label: '캠핑용품', items: [
        { label: '텐트/타프', keyword: '캠핑텐트 원터치텐트' },
        { label: '의자/테이블', keyword: '캠핑의자 캠핑테이블' },
        { label: '캠핑조명', keyword: '캠핑랜턴 감성조명' },
        { label: '캠핑취사', keyword: '그리들 캠핑버너' },
      ]},
      { label: '등산/레저', items: [
        { label: '등산용품', keyword: '등산가방 등산스틱' },
        { label: '바이크용품', keyword: '헬멧 무선충전거치대' },
      ]}
    ]},
    { label: '스포츠/헬스', icon: Dumbbell, subs: [
      { label: '홈트레이닝', items: [
        { label: '요가/필라테스', keyword: '요가매트 폼롤러' },
        { label: '아령/푸쉬업바', keyword: '덤벨 푸쉬업바' },
        { label: '스트레칭/재활', keyword: '마사지건 지압발판' },
      ]},
      { label: '구기스포츠', items: [
        { label: '골프용품', keyword: '골프공 파우치' },
        { label: '테니스/라켓', keyword: '테니스그립 보호대' },
      ]}
    ]},
    { label: '유아동/출산', icon: Baby, subs: [
      { label: '아이용품', items: [
        { label: '유아장난감', keyword: '아동교구 발달완구' },
        { label: '아동식기', keyword: '아동식기세트 빨대컵' },
        { label: '기저귀가방', keyword: '기저귀가방 백팩' },
      ]},
      { label: '육아지원', items: [
        { label: '유모차용품', keyword: '유모차핸드머프 걸이' },
        { label: '카시트소품', keyword: '목쿠션 햇빛가리개' },
      ]}
    ]},
    { label: '반려동물', icon: PawPrint, subs: [
      { label: '강아지용품', items: [
        { label: '강아지간식', keyword: '강아지간식 수제간식' },
        { label: '위생용품', keyword: '배변패드 강아지샴푸' },
        { label: '산책용품', keyword: '강아지하네스 리드줄' },
      ]},
      { label: '고양이용품', items: [
        { label: '위생/청결', keyword: '고양이모래 두부모래' },
        { label: '고양이놀이', keyword: '캣타워 스크래쳐' },
      ]}
    ]},
    { label: '패션/잡화', icon: Shirt, subs: [
      { label: '남성/여성 상의', items: [
        { label: '반팔/긴팔', keyword: '프린팅티셔츠 오버핏티' },
        { label: '이너웨어', keyword: '기능성내의 가운' },
      ]},
      { label: '의류잡화/신발', items: [
        { label: '가방/지갑', keyword: '메신저백 카드지갑' },
        { label: '신발용품', keyword: '운동화 깔창 슬리퍼' },
      ]}
    ]},
    { label: '가구/인테리어', icon: Sofa, subs: [
      { label: '인테리어', items: [
        { label: '무드등/조명', keyword: '취침등 오로라조명' },
        { label: '소품/장식', keyword: '벽시계 데스크테리어' },
        { label: '페브릭/커튼', keyword: '러그 방석 담요' },
      ]},
      { label: '가구/선반', items: [
        { label: '소형가구', keyword: '사이드테이블 협탁' },
        { label: '선반/정리', keyword: '공간박스 벽선반' },
      ]}
    ]},
    { label: '문구/완구', icon: Sparkles, subs: [
      { label: '사무/문구', items: [
        { label: '포토/앨범', keyword: '인생네컷앨범 다꾸용품' },
        { label: '필기구/사무', keyword: '볼펜샤프 독서대' },
      ]},
      { label: '완구/취미', items: [
        { label: '피규어/장난감', keyword: '피규어장식장 블록' },
        { label: '보드게임/취미', keyword: '보드게임 퍼즐' },
      ]}
    ]},
  ];


  const handleCategorySearch = (subLabel: string, keyword: string) => {
    setActiveCategory(subLabel);
    setKeyword(keyword);
    handleSearchWithKeyword(keyword);
  };

  const displayProducts = [...products]
    .filter(p => gradeFilter === 'all' || p.calculated.grade === gradeFilter)
    .sort((a, b) => {
      if (sortBy === 'productPrice') return a.productPrice - b.productPrice;
      if (sortBy === 'competitionStrength') return a.calculated.competitionStrength - b.calculated.competitionStrength;
      return (b.calculated as any)[sortBy] - (a.calculated as any)[sortBy];
    });

  const handleExportCSV = () => {
    const headers = ['상품명', '가격(원)', '소싱점수', '등급', '쿠팡링크'];
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
      
      // Fetch market stats
      const statsRes = await fetch(`/api/keyword-stats?keyword=${kw}`);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 dark:bg-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Header */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/70 backdrop-blur-md dark:bg-slate-900/70 dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              훈프로 <span className="text-indigo-400">소싱 파인더</span>
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Feature 5: Today's Golden Keywords - Full Width Top Bar */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-5 px-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-200/50"><Sparkles className="w-5 h-5 text-white" /></div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">오늘의 <span className="text-amber-500">훈프로 키워드</span></h3>
                 </div>
                 <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-700 mx-4" />
                 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Blue Ocean Discovery</p>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-2">
                 {goldenKeywords.length > 0 ? goldenKeywords.map((g, idx) => (
                    <button key={idx} onClick={() => { setKeyword(g.keyword); handleSearchWithKeyword(g.keyword); }} className="flex-shrink-0 w-[200px] bg-slate-50 dark:bg-slate-900/40 border-2 border-transparent hover:border-amber-400/50 p-3.5 rounded-[24px] flex items-center justify-between transition-all group active:scale-95 shadow-sm">
                       <div className="text-left overflow-hidden">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-400 transition-colors uppercase">{g.keyword}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 tracking-tight">{g.category}</p>
                       </div>
                       <div className="flex flex-col items-end ml-3">
                          <span className="text-[9px] font-black text-amber-500">{g.hotIndex}%</span>
                          <div className="w-7 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${g.hotIndex}%` }} /></div>
                       </div>
                    </button>
                 )) : [1,2,3,4,5,6].map(i => <div key={i} className="w-[200px] h-14 bg-slate-100 animate-pulse rounded-[24px]" />)}
              </div>
        </motion.div>

        {/* Global Horizontal Control Bar (Categories First, then Search) */}
        <div className="sticky top-[64px] z-30 flex flex-col gap-4 bg-[#F8FAFC]/80 backdrop-blur-md pb-4 pt-2 dark:bg-slate-900/80">
           {/* Row 1: Category Discovery (Horizontal Navigation) */}
           <div className="bg-white dark:bg-slate-800 rounded-[28px] p-3 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 border-r pr-6 shrink-0">
                 <Sparkles className="w-4 h-4 text-emerald-500" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">카테고리</span>
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
                       {/* Level 2 & 3 Mobile-style Popup menu */}
                       <AnimatePresence>
                          {expandedCategory === cat.label && (
                             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed top-[260px] left-8 right-8 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl border border-white/50 dark:border-slate-700 ring-1 ring-slate-200/50">
                                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                                   <div className="flex items-center gap-2 text-indigo-400 font-black text-lg"><cat.icon className="w-6 h-6" />{cat.label} 하위 분류</div>
                                   <button onClick={() => setExpandedCategory(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                                </div>
                                <div className="grid grid-cols-4 gap-12">
                                   {cat.subs.map(sub => (
                                      <div key={sub.label} className="space-y-4">
                                         <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50">{sub.label}</h4>
                                         <div className="flex flex-col gap-2">
                                            {sub.items.map(item => (
                                               <button 
                                                  key={item.label} 
                                                  onClick={() => { handleCategorySearch(item.label, item.keyword); setExpandedCategory(null); }}
                                                  className={`text-left py-2 px-3 rounded-xl text-[12px] font-bold transition-all ${activeCategory === item.label ? 'bg-indigo-50 text-indigo-400 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-400'}`}
                                               >
                                                  • {item.label}
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

           {/* Row 2: Search & Analysis Tools */}
           <div className="bg-white dark:bg-slate-800 rounded-[32px] p-4 border border-slate-100 dark:border-slate-700 shadow-xl flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={keyword} 
                  onChange={(e) => setKeyword(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="공략할 상품 키워드를 입력하세요..." 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none text-sm font-bold shadow-inner focus:ring-2 ring-indigo-500/20 transition-all" 
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
                  title="엑셀 저장"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
           </div>
        </div>

          
          {/* Keyword Insight Dashboard - New (Feature 3) */}
          <AnimatePresence>
            {!loading && keywordStats && products.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl"><TrendingUp className="w-6 h-6 text-indigo-400" /></div>
                    <div>
                      <h2 className="text-xl font-black">{keywordStats.keyword} <span className="text-slate-400 font-bold ml-2">시장성 분석</span></h2>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Market Insight Analytics</p>
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
                        <div key={idx} className="bg-slate-900/40 p-5 rounded-[24px] border border-slate-800 relative overflow-hidden group mb-4 last:mb-0">
                           <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${item.isTrend ? item.color : 'text-slate-400'}`}>{item.label}</p>
                           <p className={`text-2xl font-black ${item.color}`}>{item.val}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-1">⎯ {item.detail}</p>
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
                        <div key={idx} className="bg-slate-900/40 p-5 rounded-[24px] border border-slate-800 relative overflow-hidden group mb-4 last:mb-0">
                           <p className={`text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400`}>{item.label}</p>
                           <p className={`text-2xl font-black ${item.color}`}>{item.val}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-1">⎯ {item.detail}</p>
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
               <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl p-1 border dark:border-slate-700 shadow-sm">
                {(['all', 'Excellent', 'Good', 'Fair', 'Bad'] as const).map(g => (
                  <button key={g} onClick={() => setGradeFilter(g)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${gradeFilter === g ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>{g}</button>
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
                    <motion.div key={product.productId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden flex flex-col">
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
                      
                      <div className="p-5 flex-1 flex flex-col uppercase">
                        <h3 className="font-bold text-[13px] line-clamp-2 mb-4 h-10">{product.productName}</h3>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-black text-indigo-400">{product.productPrice.toLocaleString()}원</span>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto">
                          <div className="flex gap-2">
                             <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"><ExternalLink className="w-3 h-3" />링크</a>
                             <button 
                               onClick={() => {
                                   setSelectedProduct(product);
                                   setIsDrawerOpen(true);
                                   setWholesalePrice(0);
                                }}
                                className="flex-[2] py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                             >
                               <LayoutDashboard className="w-3 h-3" />
                               소싱 분석
                             </button>
                          </div>
                          <a 
                             href={getAiPriceUrl(product.productImage)}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all border border-amber-500/20"
                          >
                             <ShoppingBag className="w-3 h-3" />
                             🔍 이미지로 소싱 검색
                          </a>
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
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-[450px] bg-slate-900 z-[60] shadow-2xl flex flex-col">
                  <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between">
                    <div><h2 className="text-xl font-bold">소싱 수익성 분석</h2></div>
                    <button onClick={() => setIsDrawerOpen(false)}><ChevronRight className="w-6 h-6" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">



                    <div className="flex gap-6 items-start border-t border-slate-100 dark:border-slate-700 pt-10">
                      <img src={selectedProduct.productImage} className="w-20 h-20 rounded-2xl object-cover border shadow-sm" alt="" />
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 mb-2 leading-tight">{selectedProduct.productName}</h3>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">현재 쿠팡가: {selectedProduct.productPrice.toLocaleString()}원</p>
                      </div>
                    </div>


                    <div className="space-y-6 pt-6 border-t border-dashed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">수익성 시뮬레이션</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <a 
                           href={getAiPriceUrl(selectedProduct.productImage)}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="py-3.5 bg-amber-500 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 active:scale-95 transition-all"
                        >
                           <ShoppingBag className="w-3.5 h-3.5" />
                           🇨🇳 1688 이미지 소싱
                        </a>
                        <a 
                           href={`https://domeggook.com/ssl/main/search.php?wr_id=&search_text=${encodeURIComponent(extractCoreKeyword(selectedProduct.productName))}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 border dark:border-slate-700 active:scale-95 transition-all"
                        >
                           <Search className="w-3.5 h-3.5" />
                           도매꾹 키워드 검색
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase text-center">도매 매입가 (위안)</label>
                          <input 
                            type="number" 
                            placeholder="예: 25.5"
                            onChange={(e) => setWholesalePrice(Math.round(Number(e.target.value) * sourcingMultiplier))} 
                            className="text-center w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl text-sm font-bold outline-none border-indigo-100" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase text-center">소싱 배수(환율/관세)</label>
                          <input 
                            type="number" 
                            value={sourcingMultiplier} 
                            onChange={(e) => handleMultiplierChange(Number(e.target.value))} 
                            className="text-center w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" 
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 flex items-center justify-between border">
                        <span className="text-xs font-bold text-slate-500">예상 원가(합계)</span>
                        <span className="text-sm font-black text-indigo-400">{wholesalePrice.toLocaleString()}원</span>
                      </div>

                      <div className={`p-8 rounded-[32px] border-2 ${margin > 20 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10' : 'bg-slate-50 border-slate-100 dark:bg-slate-900/40'}`}>
                        <div className="flex justify-between items-center mb-6">
                           <span className="text-sm font-bold text-slate-500">예상 마진율</span>
                           <span className="text-3xl font-black text-emerald-600">{margin.toFixed(1)}%</span>
                        </div>
                        <div className="pt-6 flex justify-between items-center border-t border-dashed">
                           <span className="font-bold text-lg">최종 순이익</span>
                           <span className={`text-2xl font-black ${profit > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{profit.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t">
                    <button onClick={() => setIsDrawerOpen(false)} className="w-full py-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl">분석 완료</button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>
    </div>
  );
}
