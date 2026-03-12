// --- 1. 初始化地圖與客製化標記 ---
const map = L.map('map').setView([23.6978, 120.9605], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

let markers = [];
let polyline = null; // 用來存直線或真實道路線

const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const blueIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });

// --- 2. 真實座標資料庫 (供起終點轉換使用) ---
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
    return [fallback[0] + (Math.random()-0.5)*0.1, fallback[1] + (Math.random()-0.5)*0.1];
}

const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const loading = document.getElementById('loading');
const itineraryContent = document.getElementById('itinerary-content');
const itineraryList = document.getElementById('itinerary-list');

document.getElementById('add-stop-btn').addEventListener('click', () => {
    const container = document.getElementById('waypoints-container');
    const div = document.createElement('div');
    div.className = 'waypoint-input';
    div.innerHTML = `<input type="text" placeholder="輸入停靠站 (例如：台中逢甲)" class="stop-input"><button class="remove-btn">刪除</button>`;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
});

// --- 3. 擴充風格資料庫 (每種至少 6 個，確保數量夠選) ---
const mockDatabases = {
    food: [
        { name: "國華街永樂市場", address: "台南市中西區國華街三段", lat: 22.9975, lng: 120.1982, rating: "4.4", desc: "台南美食一級戰區。", img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "大數據推薦" },
        { name: "逢甲夜市", address: "台中市西屯區文華路", lat: 24.1790, lng: 120.6450, rating: "4.5", desc: "台灣最大夜市之一，美食指標。", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=600", source: "Google評價" },
        { name: "六合夜市", address: "高雄市新興區六合二路", lat: 22.6324, lng: 120.3019, rating: "4.1", desc: "南台灣知名海鮮與小吃聚集地。", img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "在地嚮導" },
        { name: "士林夜市", address: "台北市士林區基河路101號", lat: 25.0877, lng: 121.5245, rating: "4.3", desc: "北部必訪，超大雞排發源地。", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=600", source: "PTT推薦" },
        { name: "羅東夜市", address: "宜蘭縣羅東鎮興東路", lat: 24.6763, lng: 121.7686, rating: "4.4", desc: "東部超強夜市，羊肉湯必吃。", img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "Dcard" },
        { name: "城隍廟口小吃", address: "新竹市北區中山路75號", lat: 24.8044, lng: 120.9655, rating: "4.3", desc: "米粉、貢丸湯的經典老味道。", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=600", source: "老饕推薦" }
    ],
    sports: [
        { name: "壽山國家自然公園", address: "高雄市鼓山區萬壽路", lat: 22.6465, lng: 120.2711, rating: "4.6", desc: "豐富獼猴生態。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "健行筆記" },
        { name: "蓮池潭風景區", address: "高雄市左營區蓮潭路", lat: 22.6841, lng: 120.2945, rating: "4.5", desc: "環湖步道，適合快走。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "Strava熱區" },
        { name: "大坑十號步道", address: "台中市北屯區", lat: 24.1830, lng: 120.7300, rating: "4.6", desc: "木棧道挑戰，風景優美。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "IG打卡" },
        { name: "象山親山步道", address: "台北市信義區", lat: 25.0273, lng: 121.5752, rating: "4.7", desc: "俯瞰台北 101 的最佳健行點。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "登山客推薦" },
        { name: "日月潭環湖車道", address: "南投縣魚池鄉", lat: 23.8686, lng: 120.9239, rating: "4.8", desc: "世界最美自行車道之一。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "觀光局" },
        { name: "太魯閣國家公園", address: "花蓮縣秀林鄉", lat: 24.1611, lng: 121.6221, rating: "4.9", desc: "壯麗峽谷步道。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "國際推薦" }
    ],
    leisure: [
        { name: "奇美博物館", address: "台南市仁德區文華路二段66號", lat: 22.9346, lng: 120.2265, rating: "4.8", desc: "絕美歐洲風情。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "網美必訪" },
        { name: "駁二藝術特區", address: "高雄市鹽埕區大勇路1號", lat: 22.6200, lng: 120.2818, rating: "4.7", desc: "文創氣息舊倉庫群。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "Google Maps" },
        { name: "勤美誠品綠園道", address: "台中市西區公益路68號", lat: 24.1507, lng: 120.6625, rating: "4.6", desc: "城市中的綠洲，文青最愛。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "在地人推薦" },
        { name: "審計新村", address: "台中市西區民生路368巷", lat: 24.1425, lng: 120.6657, rating: "4.5", desc: "老宿舍改建的市集天堂。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "社群熱度分析" },
        { name: "松山文創園區", address: "台北市信義區光復南路133號", lat: 25.0441, lng: 121.5611, rating: "4.6", desc: "看展覽喝咖啡的慢活好去處。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "旅遊指南" },
        { name: "國立故宮博物院", address: "台北市士林區至善路二段221號", lat: 25.1024, lng: 121.5485, rating: "4.7", desc: "看翠玉白菜，享受歷史薰陶。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "文化部" }
    ]
};

// 順路演算法
function sortPointsByDistance(startPoint, points) {
    let sorted = [];
    let current = startPoint;
    let remaining = [...points];

    while (remaining.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            let dist = Math.pow(current.lat - remaining[i].lat, 2) + Math.pow(current.lng - remaining[i].lng, 2);
            if (dist < minDist) { minDist = dist; nearestIdx = i; }
        }
        current = remaining[nearestIdx];
        sorted.push(current);
        remaining.splice(nearestIdx, 1);
    }
    return sorted;
}

document.getElementById('submit-btn').addEventListener('click', () => generateRoute());
document.getElementById('refresh-btn').addEventListener('click', () => generateRoute());
document.getElementById('back-btn').addEventListener('click', () => {
    page2.classList.add('hidden');
    page1.classList.remove('hidden');
    clearMap();
    map.setView([23.6978, 120.9605], 7);
});

// --- 4. 生成路線核心邏輯 (加入非同步 async) ---
async function generateRoute() {
    page1.classList.add('hidden');
    page2.classList.remove('hidden');
    itineraryContent.classList.add('hidden');
    loading.classList.remove('hidden');
    clearMap();

    const startText = document.getElementById('start-point').value.trim() || "台北";
    const endText = document.getElementById('end-point').value.trim() || "高雄";
    const startCoord = getCoordinate(startText, [25.0478, 121.5170]); 
    const endCoord = getCoordinate(endText, [22.6273, 120.3014]);   

    const startNode = { name: startText, address: "定位出發點", lat: startCoord[0], lng: startCoord[1], rating: "-", desc: "行程準備開始！", type: "start", source: "系統定位" };
    const endNode = { name: endText, address: "最終目的地", lat: endCoord[0], lng: endCoord[1], rating: "-", desc: "順利抵達終點！", type: "end", source: "系統定位" };

    let userWaypoints = [];
    document.querySelectorAll('.stop-input').forEach(input => {
        if (input.value.trim() !== "") {
            const coord = getCoordinate(input.value.trim(), [23.5, 120.5]); 
            userWaypoints.push({ name: `(您指定) ${input.value.trim()}`, address: "中途停靠站", lat: coord[0], lng: coord[1], rating: "-", desc: "使用者指定必須停靠。", type: "waypoint", source: "User Input" });
        }
    });

    // 動態計算要補幾個 AI 推薦點
    const requestedStops = parseInt(document.getElementById('stop-count').value) || 4;
    // 如果使用者手動輸入的點已經超過了，就不補；如果還沒滿，就用 AI 補滿
    const aiNeeded = Math.max(0, requestedStops - userWaypoints.length);
    
    const currentStyle = document.getElementById('travel-style').value;
    let aiPool = [...mockDatabases[currentStyle]];
    
    // 隨機打亂資料庫，讓每次按「重新刷新」都有不同結果
    aiPool.sort(() => 0.5 - Math.random());
    // 根據算出來的數量切片
    const aiRecommendations = aiPool.slice(0, aiNeeded);

    const pointsToSort = [...userWaypoints, ...aiRecommendations];
    const sortedMiddlePoints = sortPointsByDistance(startNode, pointsToSort);

    const finalRoute = [startNode, ...sortedMiddlePoints, endNode];

    let currentHour = 9;
    finalRoute.forEach((stop) => {
        stop.time = `${String(currentHour).padStart(2, '0')}:00 - ${String(currentHour+1).padStart(2, '0')}:30`;
        currentHour += 2; 
    });

    // 等待 1 秒假裝思考，然後開始呼叫真實路徑 API
    setTimeout(() => {
        loading.classList.add('hidden');
        itineraryContent.classList.remove('hidden');
        renderItinerary(finalRoute);
        drawMapWithRealRoads(finalRoute); // 呼叫新的導航畫線函式
    }, 1000);
}

function renderItinerary(routeData) {
    itineraryList.innerHTML = ''; 
    routeData.forEach((stop, index) => {
        let stepName = `第 ${index} 站`;
        if (stop.type === "start") stepName = "起點";
        if (stop.type === "end") stepName = "終點";

        let extraHTML = '';
        if (stop.menu) extraHTML += `<div class="menu-box"><b>📖 熱門菜單：</b><br>${stop.menu}</div>`;
        if (stop.img) extraHTML += `<img src="${stop.img}" class="place-img">`;

        const html = `
            <details ${index === 0 ? 'open' : ''}>
                <summary><span class="time-badge">${stop.time}</span> ${stepName}：${stop.name}</summary>
                <div class="stop-info">
                    <p><b>📍 地址：</b>${stop.address}</p>
                    <p><b>⭐ Google 評分：</b><span class="rating">${stop.rating !== "-" ? stop.rating + " 顆星" : "-"}</span></p>
                    <p><b>📝 AI 簡介：</b>${stop.desc}</p>
                    ${extraHTML}
                    <span class="source-text">${stop.source}</span>
                </div>
            </details>
        `;
        itineraryList.innerHTML += html;
    });
}

// --- 5. 真實道路導航繪製 (OSRM API) ---
async function drawMapWithRealRoads(routeData) {
    let coordsForMarker = [];
    let coordsStringForOSRM = []; // OSRM 格式是 經度,緯度

    routeData.forEach((stop) => {
        const coord = [stop.lat, stop.lng];
        coordsForMarker.push(coord);
        coordsStringForOSRM.push(`${stop.lng},${stop.lat}`); // 注意這裡 lng 在前面
        
        let markerIcon = blueIcon; 
        if (stop.type === "start") markerIcon = greenIcon; 
        if (stop.type === "end") markerIcon = redIcon;   
        
        const popupContent = `<div style="font-size:14px;"><b>${stop.time}</b><br><b>${stop.name}</b></div>`;
        const marker = L.marker(coord, { icon: markerIcon }).addTo(map).bindPopup(popupContent);
        markers.push(marker);
        if (stop.type === "start") marker.openPopup();
    });

    // 組合 OSRM API 網址 (免費導航服務)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStringForOSRM.join(';')}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if(data.code === 'Ok') {
            // 解析 GeoJSON 來畫出真實馬路！
            polyline = L.geoJSON(data.routes[0].geometry, {
                style: { color: '#3498db', weight: 5, opacity: 0.8 }
            }).addTo(map);
        } else {
            // 萬一座標太離譜 (例如在海裡)，退回畫直線
            polyline = L.polyline(coordsForMarker, {color: '#3498db', weight: 4, dashArray: '8, 8'}).addTo(map);
        }
    } catch(e) {
        // 如果沒網路或 API 當機，也退回畫直線
        polyline = L.polyline(coordsForMarker, {color: '#3498db', weight: 4, dashArray: '8, 8'}).addTo(map);
    }
    
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
}

function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];
}