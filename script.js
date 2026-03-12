// --- 1. 初始化地圖與客製化標記顏色 ---
const map = L.map('map').setView([23.6978, 120.9605], 7); // 預設看全台灣
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

let markers = [];
let polyline = null;

// 定義不同顏色的地圖圖標 (引用自開源專案)
const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const blueIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

// --- 2. 建立台灣主要縣市的「假 Geocoding 資料庫」 ---
// 只要使用者輸入包含這些關鍵字，就會抓出對應座標，讓地圖看起來是真的在定位
const geoDB = {
    "台北": [25.0478, 121.5170], "桃園": [24.9936, 121.3010], "新竹": [24.8138, 120.9675],
    "台中": [24.1477, 120.6736], "彰化": [24.0518, 120.5393], "南投": [23.9037, 120.6934],
    "嘉義": [23.4801, 120.4491], "台南": [22.9997, 120.2270], "高雄": [22.6273, 120.3014], 
    "楠梓": [22.7293, 120.3298], "屏東": [22.6694, 120.4862], "墾丁": [21.9449, 120.7967]
};

function getCoordinate(keyword, fallback) {
    for (let key in geoDB) {
        if (keyword.includes(key)) return geoDB[key];
    }
    // 如果都沒對中，就在 fallback 座標附近隨機偏移一點點，避免重疊
    return [fallback[0] + (Math.random()-0.5)*0.2, fallback[1] + (Math.random()-0.5)*0.2];
}

const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const loading = document.getElementById('loading');
const itineraryContent = document.getElementById('itinerary-content');
const itineraryList = document.getElementById('itinerary-list');

// --- 3. 新增停靠站邏輯 ---
document.getElementById('add-stop-btn').addEventListener('click', () => {
    const container = document.getElementById('waypoints-container');
    const div = document.createElement('div');
    div.className = 'waypoint-input';
    div.innerHTML = `<input type="text" placeholder="輸入停靠站 (例如：台中逢甲)" class="stop-input"><button class="remove-btn">刪除</button>`;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
});

// 風格資料庫
const mockDatabases = {
    food: [
        { name: "奇美博物館", address: "台南市仁德區文華路二段66號", lat: 22.9346, lng: 120.2265, rating: "4.8", desc: "充滿歐洲風情的博物館，適合早上走走拍照。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "資料來源：Instagram 熱門打卡點" },
        { name: "國華街永樂市場", address: "台南市中西區國華街三段", lat: 22.9975, lng: 120.1982, rating: "4.4", desc: "台南美食一級戰區。根據常態分配分析顯示，此區在午餐時段熱度達到峰值。", menu: "🍲 金得春捲 $50<br>🥣 富盛號碗粿 $35", img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "資料來源：Google Maps 綜合評價" }
    ],
    sports: [
        { name: "壽山國家自然公園", address: "高雄市鼓山區萬壽路", lat: 22.6465, lng: 120.2711, rating: "4.6", desc: "擁有豐富獼猴生態。經爬蟲擷取論壇資料，此步道為南台灣熱度 Top 2。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "資料來源：健行筆記 API" }
    ],
    leisure: [
        { name: "駁二藝術特區", address: "高雄市鹽埕區大勇路1號", lat: 22.6200, lng: 120.2818, rating: "4.7", desc: "充滿文創氣息的舊倉庫群。停留時間中位數高達 3 小時。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "資料來源：Google Maps" }
    ]
};

// --- 4. 排序演算法：確保路線「順路」不會亂折 (Nearest Neighbor) ---
function sortPointsByDistance(startPoint, points) {
    let sorted = [];
    let current = startPoint;
    let remaining = [...points];

    while (remaining.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            // 計算兩點之間的直線距離的平方
            let dist = Math.pow(current.lat - remaining[i].lat, 2) + Math.pow(current.lng - remaining[i].lng, 2);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
        current = remaining[nearestIdx];
        sorted.push(current);
        remaining.splice(nearestIdx, 1);
    }
    return sorted;
}

// 事件綁定
document.getElementById('submit-btn').addEventListener('click', () => generateRoute());
document.getElementById('refresh-btn').addEventListener('click', () => generateRoute());
document.getElementById('back-btn').addEventListener('click', () => {
    page2.classList.add('hidden');
    page1.classList.remove('hidden');
    clearMap();
    map.setView([23.6978, 120.9605], 7);
});

// --- 5. 核心：產生路線 ---
function generateRoute() {
    page1.classList.add('hidden');
    page2.classList.remove('hidden');
    itineraryContent.classList.add('hidden');
    loading.classList.remove('hidden');
    clearMap();

    // 擷取起點與終點 (並轉換為座標)
    const startText = document.getElementById('start-point').value.trim() || "台北火車站";
    const endText = document.getElementById('end-point').value.trim() || "高雄火車站";
    const startCoord = getCoordinate(startText, [25.0478, 121.5170]); // 找不到預設台北
    const endCoord = getCoordinate(endText, [22.6273, 120.3014]);   // 找不到預設高雄

    const startNode = { name: startText, address: "定位出發點", lat: startCoord[0], lng: startCoord[1], rating: "-", desc: "行程準備開始！AI 已為您計算出發時間。", type: "start", source: "系統定位" };
    const endNode = { name: endText, address: "最終目的地", lat: endCoord[0], lng: endCoord[1], rating: "-", desc: "順利抵達終點！", type: "end", source: "系統定位" };

    // 擷取使用者新增的「停靠站」
    let userWaypoints = [];
    document.querySelectorAll('.stop-input').forEach(input => {
        if (input.value.trim() !== "") {
            const coord = getCoordinate(input.value.trim(), [23.5, 120.5]); // 隨機在台灣中部
            userWaypoints.push({ name: `(您指定) ${input.value.trim()}`, address: "中途停靠站", lat: coord[0], lng: coord[1], rating: "-", desc: "使用者指定必須停靠的地點。", type: "waypoint", source: "User Input" });
        }
    });

    // 抓取 AI 推薦地點
    const currentStyle = document.getElementById('travel-style').value;
    const aiRecommendations = mockDatabases[currentStyle];

    // 將「停靠站」與「AI推薦」混和，然後執行【順路演算法】排序
    const pointsToSort = [...userWaypoints, ...aiRecommendations];
    const sortedMiddlePoints = sortPointsByDistance(startNode, pointsToSort);

    // 組合最終路線：起點 -> 排序後的中間點 -> 終點
    const finalRoute = [startNode, ...sortedMiddlePoints, endNode];

    // 幫排好的行程上時間 (從早上 09:00 開始慢慢加)
    let currentHour = 9;
    finalRoute.forEach((stop, index) => {
        stop.time = `${String(currentHour).padStart(2, '0')}:00 - ${String(currentHour+1).padStart(2, '0')}:30`;
        currentHour += 2; // 每站加兩小時
    });

    setTimeout(() => {
        loading.classList.add('hidden');
        itineraryContent.classList.remove('hidden');
        renderItinerary(finalRoute);
        drawMap(finalRoute);
    }, 1500);
}

function renderItinerary(routeData) {
    itineraryList.innerHTML = ''; 
    routeData.forEach((stop, index) => {
        let stepName = `第 ${index} 站`;
        if (stop.type === "start") stepName = "起點";
        if (stop.type === "end") stepName = "終點";

        let extraHTML = '';
        if (stop.menu) extraHTML += `<div class="menu-box"><b>📖 熱門菜單/推薦：</b><br>${stop.menu}</div>`;
        if (stop.img) extraHTML += `<img src="${stop.img}" class="place-img">`;

        const html = `
            <details ${index === 0 ? 'open' : ''}>
                <summary><span class="time-badge">${stop.time}</span> ${stepName}：${stop.name}</summary>
                <div class="stop-info">
                    <p><b>📍 地址：</b>${stop.address}</p>
                    <p><b>⭐ Google 評分：</b><span class="rating">${stop.rating !== "-" ? stop.rating + " 顆星" : "-"}</span></p>
                    <p><b>📝 AI 分析簡介：</b>${stop.desc}</p>
                    ${extraHTML}
                    <span class="source-text">${stop.source}</span>
                </div>
            </details>
        `;
        itineraryList.innerHTML += html;
    });
}

function drawMap(routeData) {
    let coords = [];
    routeData.forEach((stop) => {
        const coord = [stop.lat, stop.lng];
        coords.push(coord);
        
        // 判斷要用什麼顏色的圖標
        let markerIcon = blueIcon; // 預設藍色
        if (stop.type === "start") markerIcon = greenIcon; // 起點綠色
        if (stop.type === "end") markerIcon = redIcon;   // 終點紅色
        
        const popupContent = `<div style="font-size:14px;"><b>${stop.time}</b><br><b>${stop.name}</b><br>⭐ ${stop.rating}</div>`;
        const marker = L.marker(coord, { icon: markerIcon }).addTo(map).bindPopup(popupContent);
        markers.push(marker);
        
        if (stop.type === "start") marker.openPopup();
    });
    
    // 畫線
    polyline = L.polyline(coords, {color: '#3498db', weight: 4, dashArray: '8, 8'}).addTo(map);
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
}

function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];
}