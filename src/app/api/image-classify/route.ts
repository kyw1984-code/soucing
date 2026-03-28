import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// ImageNet 클래스 → 한국어 도매꾹 검색 키워드 매핑
const LABEL_TO_KEYWORD: Record<string, string[]> = {
  // 전자기기
  'laptop': ['노트북'],
  'notebook': ['노트북'],
  'desktop_computer': ['데스크탑'],
  'monitor': ['모니터'],
  'keyboard': ['키보드'],
  'mouse': ['마우스'],
  'remote_control': ['리모컨'],
  'cellular_telephone': ['스마트폰'],
  'telephone': ['전화기'],
  'earphone': ['이어폰'],
  'headphone': ['헤드폰'],
  'speaker': ['블루투스스피커'],
  'ipod': ['mp3플레이어'],
  'joystick': ['게임패드'],
  'hard_disc': ['외장하드'],
  'camera': ['카메라'],
  'digital_camera': ['디지털카메라'],
  'tripod': ['삼각대'],
  'projector': ['빔프로젝터'],
  'television': ['TV'],
  'radio': ['라디오'],
  'printer': ['프린터'],
  'calculator': ['계산기'],
  'smartwatch': ['스마트워치'],
  'wristwatch': ['손목시계'],
  // 주방/식기
  'coffee_mug': ['머그컵'],
  'cup': ['컵'],
  'mug': ['머그컵'],
  'teapot': ['주전자'],
  'coffeepot': ['커피포트'],
  'water_bottle': ['텀블러'],
  'water_jug': ['텀블러'],
  'bottle': ['텀블러'],
  'thermos': ['보온병'],
  'bowl': ['그릇'],
  'plate': ['접시'],
  'frying_pan': ['프라이팬'],
  'pot': ['냄비'],
  'wok': ['웍'],
  'spatula': ['뒤집개'],
  'ladle': ['국자'],
  'knife': ['식칼'],
  'fork': ['포크'],
  'spoon': ['숟가락'],
  'chopsticks': ['젓가락'],
  'blender': ['블렌더'],
  'toaster': ['토스터'],
  'microwave': ['전자레인지'],
  'waffle_iron': ['와플메이커'],
  'refrigerator': ['냉장고'],
  'dishwasher': ['식기세척기'],
  // 가방/패션
  'backpack': ['백팩'],
  'bag': ['가방'],
  'briefcase': ['서류가방'],
  'handbag': ['핸드백'],
  'purse': ['지갑'],
  'wallet': ['지갑'],
  'luggage': ['여행가방'],
  'suitcase': ['캐리어'],
  'tote_bag': ['토트백'],
  'shoulder_bag': ['숄더백'],
  // 의류/패션
  'T-shirt': ['티셔츠'],
  'jersey': ['스포츠의류'],
  'sweatshirt': ['맨투맨'],
  'cardigan': ['가디건'],
  'suit': ['정장'],
  'trench_coat': ['코트'],
  'rain_jacket': ['우비'],
  'bow_tie': ['넥타이'],
  'sunglasses': ['선글라스'],
  'cap': ['모자'],
  'cowboy_hat': ['모자'],
  'hat': ['모자'],
  'helmet': ['헬멧'],
  'sock': ['양말'],
  'running_shoe': ['운동화'],
  'sneaker': ['스니커즈'],
  'boot': ['부츠'],
  'sandal': ['샌들'],
  'loafer': ['로퍼'],
  'high_heel': ['하이힐'],
  'umbrella': ['우산'],
  'watch': ['손목시계'],
  'ring': ['반지'],
  'necklace': ['목걸이'],
  'bracelet': ['팔찌'],
  // 스포츠/피트니스
  'dumbbell': ['덤벨'],
  'barbell': ['바벨'],
  'bicycle': ['자전거'],
  'mountain_bike': ['자전거'],
  'skateboard': ['스케이트보드'],
  'basketball': ['농구공'],
  'soccer_ball': ['축구공'],
  'volleyball': ['배구공'],
  'tennis_ball': ['테니스공'],
  'golf_ball': ['골프공'],
  'yoga_mat': ['요가매트'],
  'treadmill': ['런닝머신'],
  'fishing_rod': ['낚싯대'],
  'tent': ['텐트'],
  'sleeping_bag': ['침낭'],
  'lantern': ['랜턴'],
  'folding_chair': ['캠핑의자'],
  'hammock': ['해먹'],
  // 가구/인테리어
  'chair': ['의자'],
  'table': ['테이블'],
  'desk': ['책상'],
  'sofa': ['소파'],
  'couch': ['소파'],
  'bed': ['침대'],
  'wardrobe': ['옷장'],
  'bookcase': ['책장'],
  'shelf': ['선반'],
  'lamp': ['조명'],
  'candle': ['캔들'],
  'mirror': ['거울'],
  'picture_frame': ['액자'],
  'rug': ['러그'],
  'curtain': ['커튼'],
  'pillow': ['쿠션'],
  'blanket': ['담요'],
  'mattress': ['매트리스'],
  'clock': ['시계'],
  'wall_clock': ['벽시계'],
  'flowerpot': ['화분'],
  'vase': ['화병'],
  // 생활/청소
  'vacuum': ['청소기'],
  'broom': ['빗자루'],
  'clothes_iron': ['다리미'],
  'washing_machine': ['세탁기'],
  'hair_dryer': ['헤어드라이어'],
  'shaver': ['전기면도기'],
  'toothbrush': ['칫솔'],
  // 유아
  'stroller': ['유아차'],
  'teddy_bear': ['곰인형'],
  'doll': ['인형'],
  'jigsaw_puzzle': ['퍼즐'],
  // 반려동물
  'cat': ['고양이용품'],
  'dog': ['강아지용품'],
  // 뷰티
  'lipstick': ['립스틱'],
  'perfume': ['향수'],
  // 도구
  'hammer': ['망치'],
  'screwdriver': ['드라이버'],
  'wrench': ['렌치'],
  'scissors': ['가위'],
  'book': ['책'],
};

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[_,\s]+/g, '_').trim();
}

function findKeywords(labels: string[]): string[] {
  const found: string[] = [];
  for (const label of labels) {
    const normalized = normalizeLabel(label);
    if (LABEL_TO_KEYWORD[normalized]) {
      found.push(...LABEL_TO_KEYWORD[normalized]);
      continue;
    }
    for (const [key, vals] of Object.entries(LABEL_TO_KEYWORD)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        found.push(...vals);
        break;
      }
    }
  }
  return Array.from(new Set(found));
}

// child_process로 분류 실행 (webpack 번들링 완전 회피)
function runClassifier(imageUrl: string): Promise<Array<{ label: string; score: number }>> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'classify.mjs');
    const child = spawn(process.execPath, [scriptPath, imageUrl], {
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
      timeout: 60000,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.error) reject(new Error(parsed.error));
        else resolve(parsed.results);
      } catch {
        reject(new Error(stderr || `프로세스 종료 코드: ${code}`));
      }
    });

    child.on('error', reject);
  });
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 });
    }

    const results = await runClassifier(imageUrl);
    const rawLabels = results.map(r => r.label);
    const keywords = findKeywords(rawLabels);

    return NextResponse.json({
      labels: rawLabels,
      scores: results.map(r => ({ label: r.label, score: Math.round(r.score * 100) })),
      keywords: keywords.length > 0 ? keywords : null,
    });

  } catch (error: any) {
    console.error('[Image Classify Error]', error.message);
    return NextResponse.json({ error: '이미지 분류 중 오류가 발생했습니다.', detail: error.message }, { status: 500 });
  }
}
