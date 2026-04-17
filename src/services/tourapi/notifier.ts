import axios from 'axios';

/**
 * 서비스 장애 및 주요 이벤트 알림용 Slack Notifier
 */
export async function sendSlackNotification(message: string, data?: { 
  total?: number, 
  success?: number, 
  failed?: number, 
  details?: string,
  error?: string 
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL이 설정되지 않아 알림을 건너뜁니다.');
    return;
  }

  try {
    const isError = !!(data?.error || (data?.failed && data.failed > 0));
    const statusEmoji = isError ? '🔴' : '🟢';
    
    const payload = {
      text: `${statusEmoji} *[동플 허브] TourAPI 동기화 리포트*`,
      attachments: [
        {
          color: isError ? '#ff0000' : '#36a64f',
          fields: [
            { title: '상태', value: message, short: true },
            { title: '시간', value: new Date().toLocaleString('ko-KR'), short: true },
            { 
              title: '통계', 
              value: data?.total ? `총: ${data.total} / 성공: ${data.success || 0} / 실패: ${data.failed || 0}` : 'N/A', 
              short: false 
            },
            { 
              title: '상세 내용', 
              value: data?.error || data?.details || '성공적으로 완료되었습니다.', 
              short: false 
            }
          ],
          footer: 'Dongple Hub Automation',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    await axios.post(webhookUrl, payload);
  } catch (err) {
    console.error('Slack 알림 전송 실패:', err);
  }
}
