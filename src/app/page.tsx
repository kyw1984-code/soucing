"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductSkeleton } from "@/components/Skeleton";

const Sparkline = ({ data }: { data: number[] }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // 데이터 안전성 검사
  const safeData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return Array.from({ length: 12 }, () => 0);
    return data.map(v => (typeof v === 'number' && !isNaN(v)) ? v : 0);
  }, [data]);

  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData);
  const range = max - min || 1;

  const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-stretch gap-2 h-40 relative px-1">
        {safeData.map((val, i) => {
          // 최소 높이 15% 보장, 최대 100%
          const isFlat = max === min;
          const heightPercent = isFlat ? 50 : 15 + ((val - min) / range) * 85;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end relative group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`w-full rounded-t-[8px] transition-all duration-500 relative shadow-sm ${
                  hoveredIndex === i 
                    ? "bg-gradient-to-t from-orange-600 to-amber-400 shadow-amber-200/50 scale-x-105 z-10" 
                    : "bg-gradient-to-t from-amber-400 to-amber-300 opacity-80 group-hover:opacity-100"
                }`}
                style={{ height: `${heightPercent}%` }}
              >
                {hoveredIndex === i && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white px-3 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap shadow-2xl z-[100] animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
                    <div className="text-center">
                      <div className="text-[10px] text-amber-400 font-black mb-0.5 uppercase tracking-tighter">
                        {months[i]} 검색 트렌드
                      </div>
                      <div className="text-sm font-black tabular-nums">{val.toLocaleString()}건</div>
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-1 pt-3 border-t border-slate-100">
        {months.map((m, i) => (
          <span
            key={i}
            className={`text-[9px] font-black tabular-nums transition-colors duration-300 ${
              hoveredIndex === i ? "text-amber-600 scale-110" : "text-slate-400"
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="bg-amber-50 rounded-xl py-2 px-3 flex items-center justify-center gap-2 mt-2 border border-amber-100">
        <TrendingUp className="w-3 h-3 text-amber-500" />
        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.1em]">
          월간 검색량 추이 분석 (1월 - 12월)
        </p>
      </div>
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
  deliveryType?: "rocket" | "jet" | "general" | "rocket_fallback";
  calculated: {
    saleIndex: number;
    competitionStrength: number;
    sourcingScore: number;
    opportunityScore: number;
    grade: "Excellent" | "Good" | "Bad";
  };
}

const SellerLandscape = ({ products }: { products: Product[] }) => {
  if (!products || products.length === 0) return null;

  const total = Math.min(products.length, 20); // Top 20 analysis
  const topProducts = products.slice(0, total);

  const rocketCount = topProducts.filter(
    (p) => p.deliveryType === "rocket" || p.deliveryType === "rocket_fallback" || (p.isRocket && !p.deliveryType),
  ).length;
  const jetCount = topProducts.filter((p) => p.deliveryType === "jet").length;
  const rocketCombined = rocketCount + jetCount;
  
  const general = topProducts.filter(
    (p) => p.deliveryType === "general" || (!p.isRocket && !p.deliveryType),
  ).length;

  const rocketCombinedPct = (rocketCombined / total) * 100;
  const generalPct = (general / total) * 100;

  return (
    <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          판매자 경쟁 분포 (TOP {total})
        </p>
      </div>

      <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-200">
        <div
          style={{ width: `${rocketCombinedPct}%` }}
          className="h-full bg-rose-500 transition-all duration-500"
          title={`로켓/판매자로켓: ${rocketCombined}`}
        />
        <div
          style={{ width: `${generalPct}%` }}
          className="h-full bg-emerald-500 transition-all duration-500"
          title={`일반배송: ${general}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-rose-400 uppercase">
            로켓 / 판매자로켓
          </span>
          <span className="text-xl font-black text-slate-800">
            {Math.round(rocketCombinedPct)}%
          </span>
        </div>
        <div className="flex flex-col border-l border-slate-300 pl-4">
          <span className="text-[9px] font-black text-emerald-400 uppercase">
            일반배송
          </span>
          <span className="text-xl font-black text-slate-800">
            {Math.round(generalPct)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default function SourcingDashboard() {
  const [keyword, setKeyword] = useState("");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("1000000");

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Sourcing states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState(3000);
  const [sourcingMultiplier, setSourcingMultiplier] = useState<number>(300);

  const [searchError, setSearchError] = useState<{
    message: string;
    screenshot?: string;
  } | null>(null);

  const [sortBy, setSortBy] = useState<
    "sourcingScore" | "saleIndex" | "competitionStrength" | "productPrice"
  >("sourcingScore");
  const [gradeFilter, setGradeFilter] = useState<
    "all" | "Great" | "Excellent" | "Good" | "Bad"
  >("all");
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Intel states
  const [keywordStats, setKeywordStats] = useState<any | null>(null);

  // Golden trends
  const [goldenKeywords, setGoldenKeywords] = useState<any[]>([]);

  // Persistence for multiplier
  useEffect(() => {
    const saved = localStorage.getItem("sourcingMultiplier");
    if (saved) setSourcingMultiplier(Number(saved));

    // Fetch Golden Keywords
    fetch("/api/golden-keywords")
      .then((res) => res.json())
      .then((data) => setGoldenKeywords(data));
  }, []);

  const handleMultiplierChange = (val: number) => {
    setSourcingMultiplier(val);
    localStorage.setItem("sourcingMultiplier", String(val));
  };

  const calculateProfitData = (
    salePrice: number,
    cost: number,
    shipping: number,
  ) => {
    const coupangFeeRate = 0.12;
    const fee = Math.round(salePrice * coupangFeeRate);
    const profit = salePrice - cost - shipping - fee;
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    return { fee, profit, margin };
  };

  const { fee, profit, margin } = selectedProduct
    ? calculateProfitData(
        selectedProduct.productPrice,
        wholesalePrice,
        shippingFee,
      )
    : { fee: 0, profit: 0, margin: 0 };

  const CATEGORIES = [
    {
      label: "패션의류",
      icon: Shirt,
      subs: [
        {
          label: "여성패션",
          items: [
            { label: "원피스", keyword: "여성 원피스" },
            { label: "티셔츠", keyword: "여성 티셔츠" },
            { label: "블라우스", keyword: "여성 블라우스" },
            { label: "셔츠", keyword: "여성 셔츠" },
            { label: "니트", keyword: "여성 니트" },
            { label: "가디건", keyword: "여성 가디건" },
            { label: "자켓", keyword: "여성 자켓" },
            { label: "코트", keyword: "여성 코트" },
            { label: "바지", keyword: "여성 바지" },
            { label: "슬랙스", keyword: "여성 슬랙스" },
            { label: "스커트", keyword: "여성 스커트" },
            { label: "치마", keyword: "여성 치마" },
            { label: "레깅스", keyword: "여성 레깅스" },
            { label: "트레이닝복", keyword: "여성 트레이닝복" },
            { label: "홈웨어", keyword: "여성 잠옷 홈웨어" },
          ],
        },
        {
          label: "남성패션",
          items: [
            { label: "티셔츠", keyword: "남성 티셔츠" },
            { label: "셔츠", keyword: "남성 셔츠" },
            { label: "남방", keyword: "남성 남방" },
            { label: "니트", keyword: "남성 니트" },
            { label: "가디건", keyword: "남성 가디건" },
            { label: "자켓", keyword: "남성 자켓" },
            { label: "점퍼", keyword: "남성 점퍼" },
            { label: "바지", keyword: "남성 바지" },
            { label: "슬랙스", keyword: "남성 슬랙스" },
            { label: "청바지", keyword: "남성 청바지" },
            { label: "트레이닝복", keyword: "남성 트레이닝복" },
          ],
        },
      ],
    },
    {
      label: "패션잡화",
      icon: Shirt,
      subs: [
        {
          label: "신발",
          items: [
            { label: "여성 신발", keyword: "여성 구두 운동화" },
            { label: "남성 신발", keyword: "남성 구두 운동화" },
            { label: "스니커즈", keyword: "스니커즈" },
            { label: "슬립온", keyword: "슬립온" },
            { label: "슬리퍼", keyword: "슬리퍼" },
            { label: "샌들", keyword: "샌들" },
          ],
        },
        {
          label: "가방 및 잡화",
          items: [
            { label: "가방", keyword: "여성 남성 가방" },
            { label: "백팩", keyword: "백팩" },
            { label: "지갑", keyword: "지갑" },
            { label: "벨트", keyword: "벨트" },
            { label: "모자", keyword: "볼캡 버킷햇" },
            { label: "양말", keyword: "패션 양말" },
            { label: "스타킹", keyword: "여성 스타킹" },
          ],
        },
      ],
    },
    {
      label: "뷰티",
      icon: Heart,
      subs: [
        {
          label: "기초케어",
          items: [
            { label: "스킨", keyword: "스킨" },
            { label: "토너", keyword: "토너" },
            { label: "에센스", keyword: "에센스" },
            { label: "세럼", keyword: "세럼" },
            { label: "앰플", keyword: "앰플" },
            { label: "로션", keyword: "로션" },
            { label: "크림", keyword: "수분크림" },
            { label: "마스크팩", keyword: "마스크팩" },
            { label: "선케어", keyword: "선크림 선스틱" },
          ],
        },
        {
          label: "메이크업",
          items: [
            { label: "베이스", keyword: "메이크업 베이스" },
            { label: "쿠션", keyword: "쿠션 팩트" },
            { label: "립스틱", keyword: "립스틱" },
            { label: "틴트", keyword: "틴트" },
            { label: "아이브로우", keyword: "아이브로우" },
            { label: "아이섀도우", keyword: "아이섀도우" },
            { label: "마스카라", keyword: "마스카라" },
            { label: "아이라이너", keyword: "아이라이너" },
          ],
        },
        {
          label: "헤어 및 바디",
          items: [
            { label: "샴푸", keyword: "샴푸" },
            { label: "린스", keyword: "컨디셔너" },
            { label: "트리트먼트", keyword: "헤어 트리트먼트" },
            { label: "헤어에센스", keyword: "헤어 에센스 오일" },
            { label: "바디워시", keyword: "바디워시" },
            { label: "바디로션", keyword: "바디로션" },
            { label: "핸드케어", keyword: "핸드크림" },
          ],
        },
      ],
    },
    {
      label: "건강 및 헬스",
      icon: Heart,
      subs: [
        {
          label: "영양제",
          items: [
            { label: "종합비타민", keyword: "멀티비타민" },
            { label: "유산균", keyword: "유산균 프로바이오틱스" },
            { label: "오메가3", keyword: "오메가3" },
            { label: "루테인", keyword: "루테인" },
            { label: "다이어트식품", keyword: "다이어트 보조제 쉐이크" },
            { label: "홍삼", keyword: "홍삼 정" },
            { label: "인삼", keyword: "인삼 제품" },
          ],
        },
      ],
    },
    {
      label: "주방",
      icon: UtensilsCrossed,
      subs: [
        {
          label: "조리도구",
          items: [
            { label: "냄비", keyword: "인덕션 냄비" },
            { label: "찜기", keyword: "찜기" },
            { label: "프라이팬", keyword: "코팅 프라이팬" },
            { label: "주방칼", keyword: "주방칼" },
            { label: "도마", keyword: "항균 도마" },
            { label: "실리콘 조리도구", keyword: "실리콘 조리도구" },
          ],
        },
        {
          label: "식기",
          items: [
            { label: "그릇", keyword: "식기 그릇 세트" },
            { label: "컵", keyword: "유리컵 머그컵" },
            { label: "텀블러", keyword: "텀블러" },
          ],
        },
      ],
    },
    {
      label: "생활용품",
      icon: UtensilsCrossed,
      subs: [
        {
          label: "욕실용품",
          items: [
            { label: "샤워기", keyword: "필터 샤워기" },
            { label: "수전", keyword: "수전 헤드" },
            { label: "욕실매트", keyword: "규조토 매트" },
            { label: "욕실수납", keyword: "욕실 선반" },
            { label: "치약", keyword: "치약" },
            { label: "칫솔", keyword: "칫솔" },
          ],
        },
        {
          label: "청소 및 세탁",
          items: [
            { label: "세제", keyword: "세탁 세제" },
            { label: "유연제", keyword: "섬유 유연제" },
            { label: "청소도구", keyword: "청소도구 세트" },
            { label: "밀대", keyword: "밀대걸레" },
            { label: "쓰레기통", keyword: "기저귀 쓰레기통" },
            { label: "옷걸이", keyword: "논슬립 옷걸이" },
            { label: "건조대", keyword: "빨래 건조대" },
          ],
        },
      ],
    },
    {
      label: "가전",
      icon: Cpu,
      subs: [
        {
          label: "생활 및 계절가전",
          items: [
            { label: "가습기", keyword: "복합식 가습기" },
            { label: "제습기", keyword: "제습기" },
            { label: "공기청정기", keyword: "공기청정기" },
            { label: "선풍기", keyword: "선풍기" },
            { label: "서큘레이터", keyword: "서큘레이터" },
            { label: "전기방석", keyword: "전기 방석" },
            { label: "전기매트", keyword: "전기 매트" },
          ],
        },
        {
          label: "주방가전",
          items: [
            { label: "에어프라이어", keyword: "에어프라이어" },
            { label: "커피머신", keyword: "커피 머신" },
            { label: "전기포트", keyword: "전기포트" },
            { label: "믹서", keyword: "믹서기" },
            { label: "블렌더", keyword: "블렌더" },
            { label: "와플 메이커", keyword: "와플 메이커" },
            { label: "샌드위치 메이커", keyword: "샌드위치 메이커" },
          ],
        },
      ],
    },
    {
      label: "디지털",
      icon: Cpu,
      subs: [
        {
          label: "컴퓨터 주변기기",
          items: [
            { label: "마우스", keyword: "무선 마우스" },
            { label: "키보드", keyword: "기계식 키보드" },
            { label: "보조배터리", keyword: "보조배터리" },
            { label: "케이블", keyword: "데이터 케이블" },
            { label: "충전기", keyword: "고속 충전기" },
          ],
        },
        {
          label: "모바일 주변기기",
          items: [
            { label: "휴대폰케이스", keyword: "아이폰 갤럭시 케이스" },
            { label: "보호필름", keyword: "액정 보호필름" },
            { label: "거치대", keyword: "휴대폰 거치대" },
          ],
        },
      ],
    },
    {
      label: "가구 및 침구",
      icon: Sofa,
      subs: [
        {
          label: "침구",
          items: [
            { label: "베개", keyword: "경추 베개" },
            { label: "바디필로우", keyword: "바디필로우" },
            { label: "이불", keyword: "기능성 이불" },
            { label: "침구세트", keyword: "침구 세트" },
            { label: "커튼", keyword: "암막 커튼" },
            { label: "블라인드", keyword: "블라인드" },
            { label: "러그", keyword: "거실 러그" },
            { label: "카페트", keyword: "카페트" },
          ],
        },
        {
          label: "수납 및 가구",
          items: [
            { label: "의자", keyword: "컴퓨터 의자" },
            { label: "책상", keyword: "사무용 책상" },
            { label: "선반", keyword: "수납 선반" },
            { label: "행거", keyword: "스탠드 행거" },
            { label: "수납함", keyword: "리빙박스" },
            { label: "조명", keyword: "무드등" },
            { label: "스탠드", keyword: "책상 스탠드" },
          ],
        },
      ],
    },
    {
      label: "스포츠",
      icon: Tent,
      subs: [
        {
          label: "홈트레이닝",
          items: [
            { label: "요가매트", keyword: "요가매트" },
            { label: "폼롤러", keyword: "폼롤러" },
            { label: "아령", keyword: "덤벨 아령" },
            { label: "웨이트기구", keyword: "웨이트 트레이닝 기구" },
            { label: "운동복", keyword: "스포츠 운동복" },
            { label: "레깅스", keyword: "레깅스" },
          ],
        },
      ],
    },
    {
      label: "레저 및 캠핑",
      icon: Tent,
      subs: [
        {
          label: "캠핑용품",
          items: [
            { label: "텐트", keyword: "캠핑 텐트" },
            { label: "타프", keyword: "타프" },
            { label: "캠핑의자", keyword: "캠핑 의자" },
            { label: "캠핑테이블", keyword: "캠핑 테이블" },
            { label: "캠핑랜턴", keyword: "캠핑 랜턴" },
            { label: "침낭", keyword: "캠핑 침낭" },
            { label: "캠핑매트", keyword: "캠핑 매트" },
            { label: "화로대", keyword: "화로대" },
          ],
        },
      ],
    },
    {
      label: "반려동물",
      icon: PawPrint,
      subs: [
        {
          label: "펫 용품",
          items: [
            { label: "강아지 사료", keyword: "강아지 사료" },
            { label: "강아지 간식", keyword: "강아지 간식" },
            { label: "고양이 사료", keyword: "고양이 사료" },
            { label: "고양이 간식", keyword: "고양이 간식" },
            { label: "배변패드", keyword: "배변패드" },
            { label: "고양이모래", keyword: "고양이모래" },
            { label: "장난감", keyword: "반려동물 장난감" },
          ],
        },
      ],
    },
    {
      label: "자동차용품",
      icon: PawPrint,
      subs: [
        {
          label: "관리용품",
          items: [
            { label: "방향제", keyword: "차량용 방향제" },
            { label: "디퓨저", keyword: "차량용 디퓨저" },
            { label: "거치대", keyword: "차량용 거치대" },
            { label: "충전기", keyword: "차량용 무선 충전기" },
            { label: "세차용품", keyword: "셀프 세차 용품" },
            { label: "차량용 청소기", keyword: "차량용 무선 청소기" },
            { label: "블랙박스", keyword: "블랙박스" },
          ],
        },
      ],
    },
    {
      label: "식품",
      icon: Utensils,
      subs: [
        {
          label: "음료 및 커피",
          items: [
            { label: "생수", keyword: "생수" },
            { label: "탄산수", keyword: "탄산수" },
            { label: "캡슐커피", keyword: "캡슐커피" },
            { label: "커피원두", keyword: "커피 원두" },
            { label: "음료수", keyword: "음료수" },
          ],
        },
        {
          label: "간식",
          items: [
            { label: "과자", keyword: "봉지과자" },
            { label: "초콜릿", keyword: "초콜릿" },
            { label: "캔디", keyword: "캔디" },
            { label: "사탕", keyword: "사탕" },
            { label: "견과류", keyword: "견과류" },
            { label: "젤리", keyword: "젤리" },
          ],
        },
      ],
    },
    {
      label: "문구 및 취미",
      icon: Book,
      subs: [
        {
          label: "문구 및 사무",
          items: [
            { label: "필기구", keyword: "필기구 볼펜" },
            { label: "노트", keyword: "노트 수첩" },
            { label: "사무용품", keyword: "사무용품 세트" },
          ],
        },
        {
          label: "취미 및 교육",
          items: [
            { label: "미술용품", keyword: "수채화 물감" },
            { label: "화방용품", keyword: "화방 용품" },
            { label: "DIY 공예", keyword: "DIY 공예 세트" },
            { label: "서적", keyword: "베스트셀러 서적" },
            { label: "악기", keyword: "악기 상품" },
          ],
        },
      ],
    },
  ];

  const handleCategorySearch = (subLabel: string, keyword: string) => {
    setActiveCategory(subLabel);
    setKeyword(keyword);
    handleSearchWithKeyword(keyword);
  };

  const displayProducts = [...products]
    .filter((p) => gradeFilter === "all" || p.calculated.grade === gradeFilter)
    .sort((a, b) => {
      if (sortBy === "productPrice") return a.productPrice - b.productPrice;
      if (sortBy === "competitionStrength")
        return (
          a.calculated.competitionStrength - b.calculated.competitionStrength
        );
      return (b.calculated as any)[sortBy] - (a.calculated as any)[sortBy];
    });

  const handleExportCSV = () => {
    const headers = ["상품명", "가격", "소싱지수", "등급", "쿠팡링크"];
    const rows = displayProducts.map((p) => [
      `"${p.productName.replace(/"/g, '""')}"`,
      p.productPrice,
      p.calculated.sourcingScore,
      p.calculated.grade,
      p.productUrl,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
        setSearchError({ message: data.error || "검색 실패" });
        setProducts([]);
        setKeywordStats(null);
        return;
      }
      setProducts(data);

      const total = Math.min(data.length, 20);
      const topProducts = data.slice(0, total);
      const rocket = topProducts.filter(
        (p: Product) =>
          p.deliveryType === "rocket" || (p.isRocket && !p.deliveryType),
      ).length;
      const jet = topProducts.filter(
        (p: Product) => p.deliveryType === "jet",
      ).length;
      const general = topProducts.filter(
        (p: Product) =>
          p.deliveryType === "general" || (!p.isRocket && !p.deliveryType),
      ).length;

      const rocketPct = (rocket / total) * 100;
      const jetPct = (jet / total) * 100;
      const generalPct = (general / total) * 100;

      const sellerDist = JSON.stringify({ rocketPct, jetPct, generalPct });

      const statsRes = await fetch(
        `/api/keyword-stats?keyword=${kw}&sellerDistribution=${encodeURIComponent(sellerDist)}`,
      );
      const statsData = await statsRes.json();
      setKeywordStats(statsData);
    } catch (error: any) {
      setSearchError({ message: error.message });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getGradeStyle = (grade: "Great" | "Excellent" | "Good" | "Bad") => {
    if (grade === "Great")
      return "text-emerald-400 bg-emerald-50 ring-emerald-500/20";
    if (grade === "Excellent")
      return "text-indigo-400 bg-indigo-50 ring-indigo-500/20";
    if (grade === "Good") return "text-amber-400 bg-amber-50 ring-amber-500/20";
    return "text-rose-400 bg-rose-50 ring-rose-500/20";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
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
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-5 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-200/50">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">
                오늘의 <span className="text-amber-500">훈프로 키워드</span>
              </h3>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent mx-4" />
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
              Blue Ocean Discovery
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-2">
            {goldenKeywords.length > 0
              ? goldenKeywords.map((g, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setKeyword(g.keyword);
                      handleSearchWithKeyword(g.keyword);
                    }}
                    className="flex-shrink-0 w-[180px] bg-white border-2 border-slate-200 hover:border-amber-400/50 p-3 rounded-[20px] flex items-center justify-between transition-all group active:scale-95 shadow-sm"
                  >
                    <div className="text-left flex-1 pr-2 overflow-hidden">
                      <p className="text-xs font-black text-slate-800 group-hover:text-amber-400 transition-colors uppercase truncate">
                        {g.keyword}
                      </p>
                      <p className="text-[8px] text-slate-500 font-bold mt-0.5 tracking-tight truncate">
                        {g.category}
                      </p>
                    </div>
                    <div className="flex flex-col items-end ml-2 flex-shrink-0">
                      <span className="text-[8px] font-black text-amber-500">
                        {g.hotIndex}%
                      </span>
                      <div className="w-6 h-1 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${g.hotIndex}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))
              : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div
                    key={i}
                    className="w-[180px] h-14 bg-slate-100 animate-pulse rounded-[20px]"
                  />
                ))}
          </div>
        </motion.div>

        {/* Global Control Bar */}
        <div className="sticky top-[64px] z-30 flex flex-col gap-4 bg-white/80 backdrop-blur-md pb-4 pt-2">
          <div className="bg-white rounded-[32px] p-5 border border-slate-200 shadow-sm flex items-start gap-6">
            <div className="flex items-center gap-2 px-3 border-r border-slate-200 pr-6 shrink-0 mt-2.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                카테고리
              </span>
            </div>
            <div className="flex-1 py-1">
              <div className="flex gap-2.5 flex-wrap items-center">
                {CATEGORIES.map((cat) => (
                  <div key={cat.label} className="relative group/cat">
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === cat.label ? null : cat.label,
                        )
                      }
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${expandedCategory === cat.label ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-slate-50 hover:bg-indigo-50/80 text-slate-600 border border-slate-100"}`}
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                    <AnimatePresence>
                      {expandedCategory === cat.label && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setExpandedCategory(null)}
                          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="fixed inset-0 m-auto z-50 w-[95%] max-w-[1200px] h-fit max-h-[85vh] bg-white rounded-[48px] p-12 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-slate-200 overflow-y-auto"
                        >
                        <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                              <cat.icon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-slate-800">
                                {cat.label} <span className="text-indigo-600">마켓 분류</span>
                              </h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                                High-Potential Sourcing Sectors
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedCategory(null)}
                            className="p-4 hover:bg-slate-100 rounded-full transition-all group active:scale-95"
                          >
                            <X className="w-8 h-8 text-slate-300 group-hover:text-slate-600" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-16 gap-y-12">
                          {cat.subs.map((sub) => (
                            <div key={sub.label} className="space-y-6">
                              <div className="flex items-center gap-2 pb-3 border-b-2 border-indigo-500/10">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                  {sub.label}
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                {sub.items.map((item) => (
                                  <button
                                    key={item.label}
                                    onClick={() => {
                                      handleCategorySearch(
                                        item.label,
                                        item.keyword,
                                      );
                                      setExpandedCategory(null);
                                    }}
                                    className={`group flex items-center justify-between py-3 px-4 rounded-xl text-[13px] font-bold transition-all ${activeCategory === item.label ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}
                                  >
                                    <span>{item.label}</span>
                                    <ChevronRight className={`w-4 h-4 transition-all ${activeCategory === item.label ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-4 border-2 border-indigo-100 shadow-xl flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="공략할 상품 키워드를 입력하세요..."
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl outline-none text-sm font-bold shadow-inner focus:ring-2 ring-indigo-500/20 transition-all text-slate-900"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
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
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    {keywordStats.keyword}{" "}
                    <span className="text-slate-500 font-bold ml-2">
                      시장성 분석
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Market Insight Analytics
                    </p>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded-md border border-indigo-500/20">
                      {keywordStats.marketTrend}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* 월간 검색수 그래프 - 전체 너비 */}
                {keywordStats.trendData && (
                  <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-amber-400">
                      월간 검색량 추이
                    </p>
                    <Sparkline data={keywordStats.trendData} />
                  </div>
                )}

                {/* 나머지 지표들 */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">
                      총 등록 상품
                    </p>
                    <p className="text-2xl font-black text-blue-400">
                      {keywordStats.totalProducts.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      ▸ 수집된 실시간 데이터
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">
                      경쟁 강도
                    </p>
                    <p
                      className={`text-2xl font-black ${keywordStats.competitionRate < 5.0 ? "text-emerald-400" : keywordStats.competitionRate < 15.0 ? "text-indigo-400" : "text-rose-400"}`}
                    >
                      {keywordStats.competitionRate}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      ▸{" "}
                      {keywordStats.competitionRate < 5.0
                        ? "블루오션 (강력추천)"
                        : keywordStats.competitionRate < 15.0
                          ? "양호한 시장 (추천)"
                          : "레드오션 (진입주의)"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">
                      평균 객단가
                    </p>
                    <p className="text-2xl font-black text-amber-400">
                      {keywordStats.averagePrice.toLocaleString()}원
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      ▸ {keywordStats.minPrice.toLocaleString()} ~{" "}
                      {keywordStats.maxPrice.toLocaleString()} (범위)
                    </p>
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
              {(["all", "Great", "Excellent", "Good", "Bad"] as const).map(
                (g) => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${gradeFilter === g ? "bg-slate-800 text-white" : "text-slate-500"}`}
                  >
                    {g}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
          {loading ? (
            <div className="grid grid-cols-4 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-4 gap-6">
              <AnimatePresence>
                {displayProducts.map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        <div
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ring-1 ${getGradeStyle(product.calculated.grade)}`}
                        >
                          {product.calculated.grade}
                        </div>
                        {product.deliveryType === "rocket" && (
                          <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase shadow-sm">
                            로켓
                          </div>
                        )}
                        {product.deliveryType === "rocket_fallback" && (
                          <div className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black rounded uppercase shadow-sm">
                            로켓/판매자
                          </div>
                        )}
                        {product.deliveryType === "jet" && (
                          <div className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded uppercase shadow-sm">
                            판매자로켓
                          </div>
                        )}
                        {(product.deliveryType === "general" || !product.deliveryType) && (
                          <div className="px-2 py-0.5 bg-slate-400 text-white text-[8px] font-black rounded uppercase shadow-sm">
                            일반배송
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-[14px] text-slate-900 line-clamp-2 mb-4 h-10 leading-snug">
                        {product.productName}
                      </h3>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-black text-indigo-600">
                          {product.productPrice.toLocaleString()}원
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        <div className="flex gap-2">
                          <a
                            href={product.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            링크
                          </a>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                className="fixed top-0 right-0 h-full w-[450px] bg-white z-[60] shadow-2xl flex flex-col"
              >
                <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      소싱 수익성 분석
                    </h2>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)}>
                    <ChevronRight className="w-6 h-6 text-slate-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                  <div className="flex gap-6 items-start border-t border-slate-200 pt-10">
                    <img
                      src={selectedProduct.productImage}
                      className="w-20 h-20 rounded-2xl object-cover border shadow-sm"
                      alt=""
                    />
                    <div>
                      <h3 className="font-bold text-base line-clamp-2 mb-2 leading-tight text-slate-800">
                        {selectedProduct.productName}
                      </h3>
                      <p className="text-sm font-bold text-slate-600">
                        현재 쿠팡가:{" "}
                        {selectedProduct.productPrice.toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                        수익 시뮬레이션
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase text-center">
                          판매 매입가 (위안)
                        </label>
                        <input
                          type="number"
                          placeholder="예: 25.5"
                          onChange={(e) =>
                            setWholesalePrice(
                              Math.round(
                                Number(e.target.value) * sourcingMultiplier,
                              ),
                            )
                          }
                          className="text-center w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase text-center">
                          소싱 배수(환율/관세)
                        </label>
                        <input
                          type="number"
                          value={sourcingMultiplier}
                          onChange={(e) =>
                            handleMultiplierChange(Number(e.target.value))
                          }
                          className="text-center w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-200">
                      <span className="text-xs font-bold text-slate-500">
                        예상 원가(합계)
                      </span>
                      <span className="text-sm font-black text-indigo-600">
                        {wholesalePrice.toLocaleString()}원
                      </span>
                    </div>

                    <div
                      className={`p-8 rounded-[32px] border-2 ${margin > 20 ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-slate-500">
                          예상 마진율
                        </span>
                        <span className="text-3xl font-black text-emerald-600">
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="pt-6 flex justify-between items-center border-t border-dashed border-slate-200">
                        <span className="font-bold text-lg text-slate-800">
                          최종 수익
                        </span>
                        <span
                          className={`text-2xl font-black ${profit > 0 ? "text-emerald-600" : "text-rose-500"}`}
                        >
                          {profit.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl"
                  >
                    분석 완료
                  </button>
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
            쇼크트리 홈페이지
          </a>
          <a
            href="https://www.youtube.com/@saupsin89"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-sm font-bold text-slate-600"
          >
            <ExternalLink className="w-4 h-4" />
            쇼크트리 유튜브
          </a>
          <a
            href="https://open.kakao.com/o/gninI2di"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-sm font-bold text-rose-500 shadow-sm shadow-rose-100/50 ring-1 ring-rose-200/50"
          >
            <MessageSquare className="w-4 h-4" />
            단톡방 입장하기
          </a>
        </div>
      </footer>
    </div>
  );
}
