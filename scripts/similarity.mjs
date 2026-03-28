// CLIP 이미지 임베딩으로 쿠팡↔도매꾹 이미지 유사도 계산
// child_process stdin으로 JSON 입력, stdout으로 JSON 출력
import { pipeline, env } from '@xenova/transformers';

env.cacheDir = '/tmp/transformers-cache';
// 브라우저처럼 보이게 User-Agent 설정 (쿠팡 CDN 차단 우회)
env.fetchOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.coupang.com/',
  },
};

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function extractFeature(extractor, imageUrl) {
  const output = await extractor(imageUrl, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', async () => {
  try {
    const { coupangImageUrl, products } = JSON.parse(input);

    // CLIP 모델 로드 (image-feature-extraction)
    const extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');

    // 쿠팡 이미지 임베딩 추출
    const coupangVec = await extractFeature(extractor, coupangImageUrl);

    // 도매꾹 각 상품 이미지 임베딩 추출 + 유사도 계산
    const results = [];
    for (const product of products) {
      try {
        const vec = await extractFeature(extractor, product.imageUrl);
        const similarity = cosineSimilarity(coupangVec, vec);
        results.push({ ...product, similarity: Math.round(similarity * 100) });
      } catch {
        results.push({ ...product, similarity: 0 });
      }
    }

    // 유사도 내림차순 정렬
    results.sort((a, b) => b.similarity - a.similarity);

    process.stdout.write(JSON.stringify({ results }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
});
