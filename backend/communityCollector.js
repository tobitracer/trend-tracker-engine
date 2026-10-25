const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('./db');

// IP 차단 방지용 Random Delay 함수
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 디시인사이드 실시간 베스트 수집 함수
async function fetchDcinsideRealtimeBest() {
    try {
        console.log("[Collector] 디시인사이드 실시간 베스트 수집 시작...");

        // 요청 전 1~3초 비동기 Random Delay 적용
        const randomDelay = Math.floor(Math.random() * 2000) + 1000;
        await sleep(randomDelay);

        const targetUrl = 'https://gall.dcinside.com/board/lists/?id=dcbest';

        // User-Agent 가상화를 통한 차단 방지
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const postList = $('.ub-content.us-post');
        let insertedCount = 0;

        for (let i = 0; i < postList.length && insertedCount < 10; i++) {
            const element = postList[i];
            const titleElement = $(element).find('.gall_tit a').first();
            const title = titleElement.text().trim();
            const linkHref = titleElement.attr('href');

            if (title && linkHref) {
                const fullUrl = linkHref.startsWith('http') ? linkHref : `https://gall.dcinside.com${linkHref}`;

                // MySQL raw_feeds 테이블에 수집 데이터 저장 (category_id = 1: 종합/대중)
                const sql = `
                    INSERT INTO raw_feeds (category_id, site_name, title, origin_url)
                    VALUES (1, 'Dcinside', ?, ?)
                `;

                await pool.query(sql, [title, fullUrl]);
                insertedCount++;
            }
        }

        console.log(`[Collector] 디시인사이드 인기글 ${insertedCount}건 raw_feeds 저장 완료!`);
    } catch (error) {
        console.error("[Collector Error] 커뮤니티 수집 중 오류 발생:", error.message);
    }
}

// 수집 테스트 실행
async function runCommunityCollection() {
    await fetchDcinsideRealtimeBest();
    process.exit(0);
}

runCommunityCollection();