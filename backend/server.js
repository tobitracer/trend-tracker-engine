const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const graphRouter = require('./routes/graph');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 프론트엔드 정적 파일(HTML/JS/CSS) 제공 설정
app.use(express.static(path.join(__dirname, '../frontend')));

// API 라우터 등록
app.use('/api/graph', graphRouter);

// 메인 페이지 접속 시 frontend/index.html 라우팅
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 Trend Tracker Dashboard Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`========================================`);
});