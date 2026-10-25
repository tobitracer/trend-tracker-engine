const axios = require('axios');
const pool = require('./db');
require('dotenv').config();

// IP 차단 방지를 위한 Random Delay 함수 (ms)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 네이버 뉴스 수집 및 raw_feeds DB 저장 함수
async function fetchNaverNews(searchKeyword, categoryId) {
    try {
        console.log(`[Collector] '${searchKeyword}' 카테고리 뉴스 수집 시작...`);

        // 요청 전 1~3초 비동기 Random Delay 적용 (서버 과부하 & IP 차단 방지)
        const randomDelay = Math.floor(Math.random() * 2000) + 1000;
        await sleep(randomDelay);

        const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
            params: {
                query: searchKeyword,
                display: 10, // 10개씩 수집
                sort: 'date' // 최신순
            },
            headers: {
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
            }
        });

        const items = response.data.items;
        let insertedCount = 0;

        for (const item of items) {
            // HTML 태그 제거 (<b>, &quot; 등)
            const cleanTitle = item.title.replace(/<[^>]*>?/g, '').replace(/&quot;/g, '"');
            
            // MySQL raw_feeds 테이블에 수집 데이터 저장
            const sql = `
                INSERT INTO raw_feeds (category_id, site_name, title, origin_url, published_at)
                VALUES (?, 'NaverNews', ?, ?, ?)
            `;
            const pubDate = new Date(item.pubDate);

            await pool.query(sql, [categoryId, cleanTitle, item.origin_url || item.link, pubDate]);
            insertedCount++;
        }

        console.log(`[Collector] '${searchKeyword}' 뉴스 ${insertedCount}건 raw_feeds 저장 완료!`);
    } catch (error) {
        console.error(`[Collector Error] 수집 중 오류 발생:`, error.message);
    }
}

// 수집 테스트 실행 함수
async function runCollection() {
    // 3번 카테고리(뉴스/경제) - 'IT 기술' 키워드로 수집 테스트
    await fetchNaverNews('IT 기술', 3);
    process.exit(0);
}

runCollection();