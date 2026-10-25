const pool = require('./db');

// 1. 한국어 불용어(Stopwords) 기본 리스트 정의
const STOPWORDS = new Set([
    '이번', '관련', '위한', '따른', '통해', '대해', '포함', '최근', '지난',
    '이후', '현재', '가지', '경우', '바로', '게시글', '실시간', '베스트', '뉴스',
    '오늘', '내일', '이유', '모습', '상황', '공개', '확인', '진짜', '결국', '대신'
]);

// 2. 제목 텍스트 정제 및 단어(키워드) 추출 함수
function extractKeywords(title) {
    // 특수문자 제거 및 소문자화
    const cleanTitle = title.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ');
    
    // 공백 기준으로 단어 분리
    const words = cleanTitle.split(/\s+/);

    // 2글자 이상 + 불용어 제외 단어만 추출
    const filteredKeywords = Array.from(new Set(
        words.filter(word => word.length >= 2 && !STOPWORDS.has(word))
    ));

    return filteredKeywords;
}

// 3. raw_feeds에서 미처리 데이터를 가져와 Nodes/Edges 업데이트하는 메인 엔진
async function processRawFeedsToGraph() {
    try {
        console.log("[TextEngine] raw_feeds 데이터 기반 키워드 및 연관 관계 분석 시작...");

        // raw_feeds 테이블의 전체 데이터 읽기
        const [feeds] = await pool.query('SELECT category_id, title FROM raw_feeds');

        for (const feed of feeds) {
            const categoryId = feed.category_id;
            const keywords = extractKeywords(feed.title);

            if (keywords.length < 2) continue; // 연관성을 만들 단어가 2개 미만이면 스킵

            const nodeIdMap = {};

            // A. Nodes (키워드) DB 저장 및 node_id 확보
            for (const keyword of keywords) {
                const nodeSql = `
                    INSERT INTO nodes (category_id, keyword, frequency)
                    VALUES (?, ?, 1)
                    ON DUPLICATE KEY UPDATE 
                        frequency = frequency + 1,
                        updated_at = CURRENT_TIMESTAMP
                `;
                await pool.query(nodeSql, [categoryId, keyword]);

                // 저장된/기존 node_id 조회
                const [rows] = await pool.query(
                    'SELECT node_id FROM nodes WHERE category_id = ? AND keyword = ?',
                    [categoryId, keyword]
                );
                if (rows.length > 0) {
                    nodeIdMap[keyword] = rows[0].node_id;
                }
            }

            // B. Edges (단어 동시 등장 연관 가중치) DB 저장
            // N:M 조합 생성 (중복 방지를 위한 ID 정렬)
            for (let i = 0; i < keywords.length; i++) {
                for (let j = i + 1; j < keywords.length; j++) {
                    const idA = nodeIdMap[keywords[i]];
                    const idB = nodeIdMap[keywords[j]];

                    if (!idA || !idB || idA === idB) continue;

                    // 항상 작은 ID가 source_node_id가 되도록 정렬 (방향성 없는 에지 정규화)
                    const sourceId = Math.min(idA, idB);
                    const targetId = Math.max(idA, idB);

                    const edgeSql = `
                        INSERT INTO edges (category_id, source_node_id, target_node_id, weight)
                        VALUES (?, ?, ?, 1.0)
                        ON DUPLICATE KEY UPDATE 
                            weight = weight + 1.0,
                            updated_at = CURRENT_TIMESTAMP
                    `;
                    await pool.query(edgeSql, [categoryId, sourceId, targetId]);
                }
            }
        }

        console.log("[TextEngine] 키워드(Nodes) 및 연관 관계(Edges) 가중치 연산 완료!");
    } catch (error) {
        console.error("[TextEngine Error] 정제 엔진 실행 중 오류 발생:", error.message);
    }
}

// 실행
async function runEngine() {
    await processRawFeedsToGraph();
    process.exit(0);
}

runEngine();