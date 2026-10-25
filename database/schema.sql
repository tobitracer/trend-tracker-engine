-- 1. 카테고리 테이블
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

-- 기본 카테고리 데이터
INSERT INTO categories (category_id, category_name) VALUES 
(1, '종합/대중'),
(2, 'IT/기술'),
(3, '뉴스/경제'),
(4, '서브컬처/취미')
ON DUPLICATE KEY UPDATE category_name=VALUES(category_name);

-- 2. 노드(키워드) 테이블
CREATE TABLE IF NOT EXISTS nodes (
    node_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    frequency INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    UNIQUE KEY uq_category_keyword (category_id, keyword)
);

-- 3. 에지(연관 가중치) 테이블
CREATE TABLE IF NOT EXISTS edges (
    edge_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    source_node_id BIGINT NOT NULL,
    target_node_id BIGINT NOT NULL,
    weight FLOAT DEFAULT 1.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (source_node_id) REFERENCES nodes(node_id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES nodes(node_id) ON DELETE CASCADE,
    INDEX idx_category_nodes (category_id, source_node_id, target_node_id)
);

-- 4. 원본 수집 데이터 로그 테이블
CREATE TABLE IF NOT EXISTS raw_feeds (
    feed_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    site_name VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    origin_url VARCHAR(500) NOT NULL,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);