let network = null;
let nodesDataSet = new vis.DataSet();
let edgesDataSet = new vis.DataSet();

const categorySelect = document.getElementById('categorySelect');
const refreshBtn = document.getElementById('refreshBtn');
const nodeInfo = document.getElementById('nodeInfo');

// 1. Vis.js Network 초기화 함수
function initNetwork() {
    const container = document.getElementById('network-canvas');
    const data = { nodes: nodesDataSet, edges: edgesDataSet };
    
    const options = {
        nodes: {
            shape: 'dot',
            scaling: { min: 15, max: 45, label: { enabled: true, min: 12, max: 20 } },
            font: { color: '#ffffff', size: 14, strokeWidth: 2, strokeColor: '#000000' },
            color: { background: '#3b82f6', border: '#60a5fa', highlight: { background: '#ef4444', border: '#f87171' } }
        },
        edges: {
            color: { color: '#475569', highlight: '#ef4444' },
            smooth: { type: 'continuous' }
        },
        physics: {
            barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 95 }
        },
        interaction: { hover: true, tooltipDelay: 200 }
    };

    network = new vis.Network(container, data, options);

    // 노드 클릭 이벤트 바인딩
    network.on('click', function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const clickedNode = nodesDataSet.get(nodeId);
            const connectedEdges = network.getConnectedEdges(nodeId);
            
            nodeInfo.innerHTML = `
                <b>키워드:</b> <span style="color: #e94560;">${clickedNode.label}</span><br>
                <b>언급 빈도수:</b> ${clickedNode.value} 회<br>
                <b>연결된 연관 에지 수:</b> ${connectedEdges.length} 개
            `;
        } else {
            nodeInfo.innerText = "그래프 상의 노드를 클릭하면 해당 키워드의 상세 빈도수와 연관 노드가 표시됩니다.";
        }
    });
}

// 2. 백엔드 REST API 데이터 요청 및 그래프 업데이트 함수
async function fetchGraphData(categoryId) {
    try {
        nodeInfo.innerText = "데이터를 불러오는 중입니다...";
        const response = await fetch(`http://localhost:5000/api/graph/${categoryId}`);
        const result = await response.json();

        if (result.success && result.data) {
            nodesDataSet.clear();
            edgesDataSet.clear();

            // 백엔드 반환 데이터 Vis.js 규격 적용
            nodesDataSet.add(result.data.nodes);
            edgesDataSet.add(result.data.edges);

            nodeInfo.innerText = "데이터 렌더링 완료! 노드를 클릭해 상세 정보를 확인하세요.";
        } else {
            nodeInfo.innerText = "데이터를 불러오지 못했습니다.";
        }
    } catch (error) {
        console.error("API Fetch Error:", error);
        nodeInfo.innerText = "백엔드 서버와 통신 중 오류가 발생했습니다.";
    }
}

// 이벤트 리스너 등록
categorySelect.addEventListener('change', (e) => fetchGraphData(e.target.value));
refreshBtn.addEventListener('click', () => fetchGraphData(categorySelect.value));

// 최초 실행
window.onload = () => {
    initNetwork();
    fetchGraphData(categorySelect.value);
};