/**
 * TourAPI 4.0 일간 데이터 동기화 배치 스크립트
 * 실행: npx ts-node -r dotenv/config scripts/sync-tourapi.ts
 */
import { collectTouristAttractions } from '../src/services/tourapi/collector';
import { classifyAndLinkEvent } from '../src/services/tourapi/classifier';
import { sendSlackNotification } from '../src/services/tourapi/notifier';

async function main() {
  console.log('--- Standard API Sync Start ---');
  const startTime = Date.now();
  
  let stats = {
    total: 0,
    success: 0,
    failed: 0,
    details: ''
  };

  try {
    // 1. 관광지 정보 수집
    const items = await collectTouristAttractions();
    stats.total = items.length;
    
    if (items.length > 0) {
      console.log(`${items.length}개의 데이터를 수집했습니다. 처리를 시작합니다...`);

      // 2. 병렬 처리 (제한된 동시성)
      const CONCURRENCY = 5;
      for (let i = 0; i < items.length; i += CONCURRENCY) {
        const chunk = items.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          chunk.map(item => classifyAndLinkEvent(item))
        );

        results.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            stats.success++;
          } else {
            stats.failed++;
            console.error(`[Process Error] ${items[i + idx]?.title}:`, res.reason);
          }
        });
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      stats.details = `${duration}초 동안 ${stats.success}개를 успешно 처리했습니다.`;
      
      console.log(`동기화 완료: 성공 ${stats.success}, 실패 ${stats.failed}`);
      await sendSlackNotification('Batch Completed Successfully', stats);
    } else {
      await sendSlackNotification('No Items to Sync', stats);
    }

  } catch (err: any) {
    console.error('Batch Execution Error:', err);
    await sendSlackNotification('배치 실행 중 오류가 발생했습니다.', { error: err.message }, 'ERROR');
    process.exit(1);
  }

  console.log('--- Standard API Sync Finished ---');
}

main();
