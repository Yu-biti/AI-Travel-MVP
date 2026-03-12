// 初始化地圖，設定中心點在台灣
const map = L.map('map').setView([23.6978, 120.9605], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 存放地圖上標記與路線的變數
let markers = [];
let polyline = null;

// 新增停靠站按鈕邏輯
document.getElementById('add-stop-btn').addEventListener('click', () => {
    const container = document.getElementById('waypoints-container');
    const div = document.createElement('div');
    div.className = 'waypoint-input';
    div.innerHTML = `
        <input type="text" placeholder="輸入停靠站 (例如：台中逢甲)" class="stop-input">
        <button class="remove-btn">刪除</button>
    `;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
});

// 模擬 AI 規劃按鈕邏輯
document.getElementById('submit-btn').addEventListener('click', () => {
    const resultArea = document.getElementById('result-area');
    const loading = document.getElementById('loading');
    const itinerary = document.getElementById('itinerary');
    const style = document.getElementById('travel-style').value;

    // 清除舊資料與地圖標記
    resultArea.classList.remove('hidden');
    loading.classList.remove('hidden');
    itinerary.classList.add('hidden');
    markers.forEach(m => map.removeLayer(m));
    if(polyline) map.removeLayer(polyline);
    markers = [];

    // 模擬 AI 思考延遲 (2秒)
    setTimeout(() => {
        loading.classList.add('hidden');
        itinerary.classList.remove('hidden');

        // 根據不同風格產生「模擬的」結果與座標
        if (style === 'sports') {
            itinerary.innerHTML = `
                <h4>✅ 運動健走風格推薦：</h4>
                <p><b>Day 1:</b> 早上從【台北車站】出發 ➔ 中午抵達【台中大坑九號步道】健行 ➔ 晚上入住民宿。</p>
                <p><b>Day 2:</b> 早上前往【日月潭】環湖自行車道 ➔ 下午快樂賦歸。</p>
                <a href="#" style="color:#3498db;">🔗 點此查看大坑步道附近住宿 (模擬連結)</a>
            `;
            drawMapMockRoute([
                [25.0478, 121.5170], // 台北車站
                [24.1800, 120.7300], // 台中大坑
                [23.8686, 120.9239]  // 日月潭
            ]);
        } else {
            itinerary.innerHTML = `
                <h4>✅ 悠閒放鬆風格推薦：</h4>
                <p><b>Day 1:</b> 從【台北車站】出發 ➔ 搭乘高鐵直達台中，前往【勤美誠品綠園道】喝咖啡 ➔ 入住【日月潭涵碧樓】。</p>
                <a href="#" style="color:#3498db;">🔗 點此一鍵購買高鐵票與訂房 (模擬連結)</a>
            `;
            drawMapMockRoute([
                [25.0478, 121.5170], // 台北車站
                [24.1500, 120.6600], // 勤美
                [23.8686, 120.9239]  // 日月潭
            ]);
        }
    }, 2000); // 2000毫秒 = 2秒
});

// 在地圖上畫點和線的函式
function drawMapMockRoute(coords) {
    coords.forEach((coord, index) => {
        const marker = L.marker(coord).addTo(map)
            .bindPopup(`停靠站 ${index + 1}`).openPopup();
        markers.push(marker);
    });
    
    // 畫紅線連接
    polyline = L.polyline(coords, {color: 'red', weight: 4}).addTo(map);
    // 縮放地圖以顯示整條路線
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
}