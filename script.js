// 初始化地圖
const map = L.map('map').setView([22.7293, 120.3298], 10); // 預設中心在高雄
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let polyline = null;
let currentRouteAlt = false; // 用來切換 A/B 兩條模擬路線

// DOM 元素選取
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const loading = document.getElementById('loading');
const itineraryContent = document.getElementById('itinerary-content');
const itineraryList = document.getElementById('itinerary-list');

// 準備兩套模擬行程資料，讓「重新刷新路線」有變化
const mockRoutes = {
    routeA: [
        { name: "高雄楠梓 (起點)", address: "高雄市楠梓區建工路", lat: 22.7293, lng: 120.3298, type: "start", rating: "-", desc: "準備出發！" },
        { name: "奇美博物館", address: "台南市仁德區文華路二段66號", lat: 22.9346, lng: 120.2265, type: "attraction", rating: "4.8", desc: "台灣館藏最豐富的私人博物館，外觀超好拍。" },
        { name: "文章牛肉湯", address: "台南市安平區安平路300號", lat: 22.9995, lng: 120.1764, type: "restaurant", rating: "4.5", desc: "在地必吃超人氣美食。", menu: "🍲 招牌牛肉湯 $150<br>🍚 牛肉肉燥飯 $30<br>🥬 芥蘭牛肉 $120" },
        { name: "安平老街 (終點)", address: "台南市安平區延平街", lat: 23.0007, lng: 120.1609, type: "end", rating: "4.3", desc: "走走逛逛買伴手禮。" }
    ],
    routeB: [
        { name: "高雄楠梓 (起點)", address: "高雄市楠梓區建工路", lat: 22.7293, lng: 120.3298, type: "start", rating: "-", desc: "出發看海去！" },
        { name: "勝利星村", address: "屏東縣屏東市青島街106號", lat: 22.6749, lng: 120.4854, type: "attraction", rating: "4.6", desc: "超美的日式眷村文創園區。" },
        { name: "邱家生魚片", address: "屏東縣恆春鎮大光路79號之51", lat: 21.9478, lng: 120.7431, type: "restaurant", rating: "4.4", desc: "CP值爆表的百元生魚片。", menu: "🐟 綜合生魚片(40片) $200<br>🦐 炒海瓜子 $250<br>🦀 奶油鮮蚵 $280" },
        { name: "墾丁大街 (終點)", address: "屏東縣恆春鎮墾丁路", lat: 21.9449, lng: 120.7967, type: "end", rating: "4.1", desc: "晚上逛夜市吃小吃。" }
    ]
};

// 進入第二頁並開始載入
document.getElementById('submit-btn').addEventListener('click', () => {
    generateRoute();
});

// 重新刷新路線
document.getElementById('refresh-btn').addEventListener('click', () => {
    currentRouteAlt = !currentRouteAlt; // 切換路線 A/B
    generateRoute();
});

// 回上一頁設定
document.getElementById('back-btn').addEventListener('click', () => {
    page2.classList.add('hidden');
    page1.classList.remove('hidden');
    clearMap();
    // 讓地圖回到初始視角
    map.setView([22.7293, 120.3298], 10);
});

// 核心函式：生成路線與 UI
function generateRoute() {
    // 畫面切換：隱藏第一頁，顯示第二頁的 Loading
    page1.classList.add('hidden');
    page2.classList.remove('hidden');
    itineraryContent.classList.add('hidden');
    loading.classList.remove('hidden');
    clearMap();

    // 模擬 AI API 請求延遲 (1.5秒)
    setTimeout(() => {
        loading.classList.add('hidden');
        itineraryContent.classList.remove('hidden');
        
        // 取得要展示的假資料
        const routeData = currentRouteAlt ? mockRoutes.routeB : mockRoutes.routeA;
        renderItinerary(routeData);
        drawMap(routeData);
    }, 1500);
}

// 渲染右側行程清單
function renderItinerary(routeData) {
    itineraryList.innerHTML = ''; // 清空舊資料
    
    routeData.forEach((stop, index) => {
        const stepName = index === 0 ? "第一站" : index === routeData.length - 1 ? "最終站" : `第 ${index + 1} 站`;
        
        let menuHTML = '';
        if (stop.menu) {
            menuHTML = `<div class="menu-box"><b>📖 推薦菜單/特色：</b><br>${stop.menu}</div>`;
        }

        const html = `
            <details ${index === 0 ? 'open' : ''}>
                <summary>${stepName}：${stop.name}</summary>
                <div class="stop-info">
                    <p><b>📍 地址：</b>${stop.address}</p>
                    <p><b>⭐ Google 評分：</b><span class="rating">${stop.rating} 顆星</span></p>
                    <p><b>📝 簡介：</b>${stop.desc}</p>
                    ${menuHTML}
                </div>
            </details>
        `;
        itineraryList.innerHTML += html;
    });
}

// 畫地圖標記與路線
function drawMap(routeData) {
    let coords = [];
    
    routeData.forEach((stop, index) => {
        const coord = [stop.lat, stop.lng];
        coords.push(coord);
        
        // 建立標記，並設定點擊時彈出的 Popup 資訊
        const popupContent = `
            <div style="font-size:14px;">
                <b>${stop.name}</b><br>
                <span style="color:gray; font-size:12px;">${stop.address}</span><br>
                ⭐ ${stop.rating}
            </div>
        `;
        
        const marker = L.marker(coord).addTo(map).bindPopup(popupContent);
        markers.push(marker);
        
        // 預設展開第一個點的 Popup
        if(index === 0) marker.openPopup();
    });
    
    // 畫路線
    polyline = L.polyline(coords, {color: '#3498db', weight: 5, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
}

// 清除地圖資料
function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];
}