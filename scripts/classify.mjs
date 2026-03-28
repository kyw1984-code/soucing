// 이 파일은 Next.js 밖에서 child_process로 실행됩니다.
// webpack이 번들링하지 않으므로 onnxruntime-node가 정상 동작합니다.
import { pipeline, env } from '@xenova/transformers';

const imageUrl = process.argv[2];
if (!imageUrl) {
  process.stdout.write(JSON.stringify({ error: 'imageUrl 없음' }));
  process.exit(1);
}

env.cacheDir = '/tmp/transformers-cache';

let classifier;
try {
  classifier = await pipeline('image-classification', 'Xenova/vit-base-patch16-224');
  const results = await classifier(imageUrl, { topk: 5 });
  process.stdout.write(JSON.stringify({ results }));
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message }));
  process.exit(1);
}
