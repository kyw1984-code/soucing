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

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [sourcingMultiplier, setSourcingMultiplier] = useState<number>(250);
  const [gradeFilter, setGradeFilter] = useState<'all' | 'Excellent' | 'Good' | 'Fair' | 'Bad'>('all');
  const [goldenKeywords, setGoldenKeywords] = useState<any[]>([]);
  const [keywordStats, setKeywordStats] = useState<any>(null);

  const displayProducts = gradeFilter === 'all' 
    ? products 
    : products.filter(p => p.calculated.grade === gradeFilter);

  const profit = selectedProduct ? selectedProduct.productPrice - wholesalePrice : 0;
  const margin = selectedProduct ? (profit / selectedProduct.productPrice) * 100 : 0;

  useEffect(() => {
    const saved = localStorage.getItem('sourcingMultiplier');
    if (saved) setSourcingMultiplier(Number(saved));

    fetch('/api/golden-keywords')
      .then(res => res.json())
      .then(data => setGoldenKeywords(data));
  }, []);

  const handleMultiplierChange = (val: number) => {
    setSourcingMultiplier(val);
    localStorage.setItem('sourcingMultiplier', String(val));
  };

  const handleCoupangAiPriceDirect = (productUrl: string) => {
    if (!productUrl) return;
    window.open(productUrl, '_blank');
  };

  const handle1688KeywordSearch = async (productName: string) => {
    if (!productName) return;
    const coreKeyword = extractCoreKeyword(productName);
    let keyword = coreKeyword;
    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(coreKeyword)}`);
      const data = await res.json();
      if (data.translated) keyword = data.translated;
    } catch {}
    const searchUrl = `https://s.1688.com/selloffer/offerlist.htm?keywords=${encodeURIComponent(keyword)}`;
    window.open(searchUrl, '_blank');
  };

  const extractCoreKeyword = (productName: string): string => {
    let name = productName;
    name = name.replace(/\b[A-Za-z]{1,3}[\d][\w-]*/g, '');
    name = name.replace(/\d+(\.\d+)?\s*(L|ml|kg|g|cm|mm|m|inch|인치|GB|TB|mAh|W|V|Hz|평|세대|단계|개입|매|층|구|포|개|장|벌|켤레|족)/gi, '');
    name = name.replace(/20\d{2}(년형?|년도|형)?\b/g, '');
    name = name.replace(/\b\d+\b/g, '');
    name = name.replace(/[\[\]\(\)\-\_\+\=\!@#\$%\^\&\*\/]/g, ' ');
    return name.trim().split(/\s+/).slice(0, 3).join(' ');
  };

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setProducts([]);
    setKeywordStats(null);
    try {
      const res = await fetch(`/api/coupang?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setProducts(data.products || []);
      
      const statsRes = await fetch(`/api/keyword-stats?keyword=${encodeURIComponent(keyword)}`);
      const statsData = await statsRes.json();
      setKeywordStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchWithKeyword = (k: string) => {
    setKeyword(k);
    setTimeout(() => handleSearch(), 100);
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ["상품명,가격,품점,리뷰수,URL,점수,등급"];
    const rows = products.map(p => 
      `"${p.productName}",${p.productPrice},${p.rating || 0},${p.ratingCount || 0},"${p.productUrl}",${p.calculated.opportunityScore},${p.calculated.grade}`
    );
    const blob = new Blob([headers.concat(rows).join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sourcing_${keyword}.csv`;
    link.click();
  };

  const getGradeStyle = (grade: string) => {
     switch(grade) {
       case 'Excellent': return 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400';
       case 'Good': return 'bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400';
       default: return 'bg-slate-50 text-slate-600 ring-slate-100 dark:bg-slate-800 dark:text-slate-400';
     }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 dark:bg-slate-900 dark:text-slate-100 overflow-hidden">
      <nav className="sticky top-0 z-[100] w-full border-b border-white/20 bg-white/70 backdrop-blur-md dark:bg-slate-900/70 dark:border-slate-800">
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
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-5 px-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-200/50"><Sparkles className="w-5 h-5 text-white" /></div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">오늘의 <span className="text-amber-500">훈프로 키워드</span></h3>
                 </div>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-2">
                 {goldenKeywords.length > 0 ? goldenKeywords.map((g, idx) => (
                    <button key={idx} onClick={() => handleSearchWithKeyword(g.keyword)} className="flex-shrink-0 w-[200px] bg-slate-50 dark:bg-slate-900/40 border-2 border-transparent hover:border-amber-400/50 p-3.5 rounded-[24px] flex items-center justify-between transition-all group active:scale-95 shadow-sm">
                       <div className="text-left overflow-hidden">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-400 transition-colors uppercase">{g.keyword}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 tracking-tight">{g.category}</p>
                       </div>
                    </button>
                 )) : <div className="flex gap-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-[200px] h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}</div>}
              </div>
        </motion.div>

        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 shadow-xl">
           <div className="flex gap-3">
              <div className="relative flex-1 group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                 <input 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="검색할 상품 키워드를 입력하세요..." 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl outline-none font-bold text-slate-700 dark:text-slate-100 transition-all text-lg" 
                 />
              </div>
              <button onClick={() => handleSearch()} disabled={loading} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                소싱 제품 찾기
              </button>
           </div>
        </div>

        {!loading && keywordStats && products.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl"><TrendingUp className="w-6 h-6 text-indigo-400" /></div>
                <h2 className="text-xl font-black">{keywordStats.keyword} <span className="text-slate-400 font-bold ml-2">시장성 분석</span></h2>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-8">
                <div className="col-span-1">
                  <div className="bg-slate-900/40 p-5 rounded-[24px] border border-slate-800 mb-4">
                    <p className="text-[10px] font-black uppercase text-slate-400">월간 검색수</p>
                    <p className="text-2xl font-black text-amber-400">{keywordStats.searchVolume.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900/40 p-5 rounded-[24px] border border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400">총 등록 상품</p>
                    <p className="text-2xl font-black text-blue-400">{keywordStats.totalProducts.toLocaleString()}</p>
                  </div>
                </div>
                <div className="col-span-2"><SellerLandscape products={products} /></div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-10">
          {loading ? (
            <div className="grid grid-cols-3 gap-6">{Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
                {displayProducts.map((product) => (
                  <div key={product.productId} className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden flex flex-col relative z-0">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={product.productImage} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-[13px] line-clamp-2 mb-4 h-10 uppercase">{product.productName}</h3>
                      <div className="flex justify-between items-center mb-4"><span className="text-lg font-black text-indigo-400">{product.productPrice.toLocaleString()}원</span></div>
                      <div className="flex flex-col gap-2 mt-auto relative z-50">
                        <div className="flex gap-2">
                           <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] font-bold text-slate-600 flex items-center justify-center gap-2 border dark:border-slate-700 hover:bg-slate-100 transition-all pointer-events-auto"><ExternalLink className="w-3 h-3" />상세</a>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsDrawerOpen(true); }} className="flex-[2] py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer pointer-events-auto"><LayoutDashboard className="w-3 h-3" />소싱 분석</button>
                        </div>
                        <div className="flex gap-2 w-full mt-2 relative z-[60]">
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleCoupangAiPriceDirect(product.productUrl); }} className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer pointer-events-auto active:scale-95 shadow-lg"><ShoppingBag className="w-3 h-3" />1688 이미지(확장)</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handle1688KeywordSearch(product.productName); }} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer pointer-events-auto active:scale-95 shadow-lg"><Search className="w-3 h-3" />키워드</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : <div className="text-center py-20 text-slate-400 font-bold">검색 결과가 없습니다.</div>}
        </div>
      </main>

      {isDrawerOpen && selectedProduct && (
        <div className="fixed inset-0 z-[10000] flex justify-end">
          <div onClick={() => setIsDrawerOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" />
          <div className="relative h-full w-[450px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l dark:border-slate-800">
            <div className="p-8 flex items-center justify-between border-b dark:border-slate-800">
              <h2 className="text-xl font-black">소싱 분석</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="flex gap-4">
                <img src={selectedProduct.productImage} className="w-24 h-24 rounded-2xl object-cover border" alt="" />
                <div>
                  <h3 className="font-bold text-sm line-clamp-2 mb-2 uppercase">{selectedProduct.productName}</h3>
                  <p className="text-lg font-black text-indigo-400">{selectedProduct.productPrice.toLocaleString()}원</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 relative z-[11000]">
                <button type="button" onClick={() => handleCoupangAiPriceDirect(selectedProduct.productUrl)} className="py-4 bg-amber-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg active:scale-95 cursor-pointer pointer-events-auto">1688 이미지 검색</button>
              </div>
              <div className="space-y-4 pt-6 border-t dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">도매가 (위안 x 배수)</label>
                    <input type="number" onChange={(e) => setWholesalePrice(Number(e.target.value) * sourcingMultiplier)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">배수 설정</label>
                    <input type="number" value={sourcingMultiplier} onChange={(e) => handleMultiplierChange(Number(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-center" />
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border-2 transition-all ${margin > 20 ? 'bg-emerald-50/50 border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 border-transparent'}`}>
                  <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold text-slate-500">예상 마진율</span><span className="text-2xl font-black text-emerald-500">{margin.toFixed(1)}%</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm font-bold">최종 순이익</span><span className={`text-xl font-black ${profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{profit.toLocaleString()}원</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
