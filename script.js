// --- 1. 初始化地圖與客製化標記 ---
const map = L.map('map').setView([23.6978, 120.9605], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

let markers = [];
let polyline = null; 

const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const blueIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const goldIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }); // 周邊景點用黃金圖標

// --- 2. 座標資料庫 ---
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

// --- DOM 元素選取 ---
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const page3 = document.getElementById('page-3');
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

// --- 3. 模擬資料庫 (主行程) ---
const mockDatabases = {
    food: [
        { name: "國華街永樂市場", address: "台南市中西區國華街三段", lat: 22.9975, lng: 120.1982, rating: "4.4", desc: "台南美食一級戰區。", img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "大數據推薦" },
        { name: "逢甲夜市", address: "台中市西屯區文華路", lat: 24.1790, lng: 120.6450, rating: "4.5", desc: "台灣最大夜市之一，美食指標。", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=600", source: "Google評價" },
        { name: "六合夜市", address: "高雄市新興區六合二路", lat: 22.6324, lng: 120.3019, rating: "4.1", desc: "南台灣知名海鮮與小吃聚集地。", img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "在地嚮導" },
        { name: "士林夜市", address: "台北市士林區基河路101號", lat: 25.0877, lng: 121.5245, rating: "4.3", desc: "北部必訪，超大雞排發源地。", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=600", source: "PTT推薦" }
    ],
    sports: [
        { name: "壽山國家自然公園", address: "高雄市鼓山區萬壽路", lat: 22.6465, lng: 120.2711, rating: "4.6", desc: "豐富獼猴生態。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "健行筆記" },
        { name: "大坑十號步道", address: "台中市北屯區", lat: 24.1830, lng: 120.7300, rating: "4.6", desc: "木棧道挑戰，風景優美。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "IG打卡" },
        { name: "象山親山步道", address: "台北市信義區", lat: 25.0273, lng: 121.5752, rating: "4.7", desc: "俯瞰台北 101 的最佳健行點。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "登山客推薦" }
    ],
    leisure: [
        { name: "奇美博物館", address: "台南市仁德區文華路二段66號", lat: 22.9346, lng: 120.2265, rating: "4.8", desc: "絕美歐洲風情。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "網美必訪" },
        { name: "駁二藝術特區", address: "高雄市鹽埕區大勇路1號", lat: 22.6200, lng: 120.2818, rating: "4.7", desc: "文創氣息舊倉庫群。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "Google Maps" },
        { name: "勤美誠品綠園道", address: "台中市西區公益路68號", lat: 24.1507, lng: 120.6625, rating: "4.6", desc: "城市中的綠洲，文青最愛。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "在地人推薦" }
    ]
};

// --- 4. 爬蟲資料庫 (點擊地圖上的黃色標記顯示於第三頁) ---
const mockNearbyPlaces = [
    { 
        type: "history", tag: "🏛️ 歷史古蹟", name: "安平古堡 (熱蘭遮城)", address: "台南市安平區國勝路82號", rating: "4.5", hours: "08:30–17:30", 
        desc: "台灣最古老的城堡，為荷蘭人於1624年所建。", 
        extraInfo: "<b>📜 歷史背景：</b><br>原稱熱蘭遮城，是台灣最早的要塞建築。曾是荷蘭人統治台灣的中樞，也是鄭氏王朝三代的居城。紅磚斑駁的城牆見證了近四百年的台灣歷史。",
        reviews: "👤 <b>王小明：</b> 充滿歷史意義，旁邊老街很好逛。<br>👤 <b>陳阿姨：</b> 門票便宜，夕陽時分拍照很美，但階梯有點陡。",
        img: "https://images.unsplash.com/photo-1582239396342-88094251df5c?auto=format&fit=crop&q=80&w=600"
    },
    { 
        type: "restaurant", tag: "🍜 在地老饕推薦", name: "阿堂鹹粥", address: "台南市中西區西門路一段728號", rating: "4.1", hours: "05:00–12:30 (週二公休)", 
        desc: "台南超人氣傳統早午餐，以濃郁的魚骨高湯聞名。", 
        extraInfo: "<b>📖 爬蟲擷取熱門菜單：</b><br>🐟 綜合鹹粥 $160 (必點)<br>🍤 香煎魚肚 $120<br>🧄 蒜泥蚵仔 $100",
        reviews: "👤 <b>Foodie_TW：</b> 湯頭非常鮮甜，雖然價格偏高但料滿實在的！<br>👤 <b>林大志：</b> 假日要排隊將近半小時，建議早點來。",
        img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600"
    },
    { 
        type: "cafe", tag: "☕ 網美打卡點", name: "海景秘境咖啡", address: "沿海公路秘境旁", rating: "4.8", hours: "14:00–20:00", 
        desc: "隱藏在海岸線旁的秘境咖啡廳，坐擁無敵海景。", 
        extraInfo: "<b>💡 AI 特色分析：</b><br>大數據顯示該店「夕陽」關鍵字出現率達 85%，建議下午 5 點左右抵達最合適。提供免費 Wi-Fi 且不限時。",
        reviews: "👤 <b>網美小花：</b> 拍照超級好看！提拉米蘇是神級的！<br>👤 <b>David H.：</b> 風有點大，但海浪聲配咖啡非常療癒。",
        img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600"
    }
];

function sortPointsByDistance(startPoint, points) {
    let sorted = []; let current = startPoint; let remaining = [...points];
    while (remaining.length > 0) {
        let nearestIdx = 0; let minDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            let dist = Math.pow(current.lat - remaining[i].lat, 2) + Math.pow(current.lng - remaining[i].lng, 2);
            if (dist < minDist) { minDist = dist; nearestIdx = i; }
        }
        current = remaining[nearestIdx]; sorted.push(current); remaining.splice(nearestIdx, 1);
    }
    return sorted;
}

// 事件綁定
document.getElementById('submit-btn').addEventListener('click', () => generateRoute());
document.getElementById('refresh-btn').addEventListener('click', () => generateRoute());
document.getElementById('back-btn').addEventListener('click', () => {
    page2.classList.add('hidden'); page1.classList.remove('hidden');
    clearMap(); map.setView([23.6978, 120.9605], 7);
});
// 綁定第三頁返回第二頁按鈕
document.getElementById('back-to-route-btn').addEventListener('click', () => {
    page3.classList.add('hidden'); page2.classList.remove('hidden');
});

// --- 5. 生成路線核心邏輯 ---
async function generateRoute() {
    page1.classList.add('hidden'); page3.classList.add('hidden');
    page2.classList.remove('hidden'); itineraryContent.classList.add('hidden');
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

    const requestedStops = parseInt(document.getElementById('stop-count').value) || 4;
    const aiNeeded = Math.max(0, requestedStops - userWaypoints.length);
    const currentStyle = document.getElementById('travel-style').value;
    let aiPool = [...mockDatabases[currentStyle]];
    aiPool.sort(() => 0.5 - Math.random());
    const aiRecommendations = aiPool.slice(0, aiNeeded);

    const pointsToSort = [...userWaypoints, ...aiRecommendations];
    const sortedMiddlePoints = sortPointsByDistance(startNode, pointsToSort);
    const finalRoute = [startNode, ...sortedMiddlePoints, endNode];

    let currentHour = 9;
    finalRoute.forEach((stop) => {
        stop.time = `${String(currentHour).padStart(2, '0')}:00 - ${String(currentHour+1).padStart(2, '0')}:30`;
        currentHour += 2; 
    });

    setTimeout(() => {
        loading.classList.add('hidden');
        itineraryContent.classList.remove('hidden');
        renderItinerary(finalRoute);
        drawMapWithRealRoads(finalRoute); 
    }, 1200);
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

// --- 6. 真實道路導航繪製 & 生成周邊景點 ---
async function drawMapWithRealRoads(routeData) {
    let coordsForMarker = [];
    let coordsStringForOSRM = []; 

    routeData.forEach((stop) => {
        const coord = [stop.lat, stop.lng];
        coordsForMarker.push(coord);
        coordsStringForOSRM.push(`${stop.lng},${stop.lat}`); 
        
        let markerIcon = blueIcon; 
        if (stop.type === "start") markerIcon = greenIcon; 
        if (stop.type === "end") markerIcon = redIcon;   
        
        const popupContent = `<div style="font-size:14px;"><b>${stop.time}</b><br><b>${stop.name}</b></div>`;
        const marker = L.marker(coord, { icon: markerIcon }).addTo(map).bindPopup(popupContent);
        markers.push(marker);
        if (stop.type === "start") marker.openPopup();
    });

    // 畫線 (呼叫 OSRM API)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStringForOSRM.join(';')}?overview=full&geometries=geojson`;
    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();
        if(data.code === 'Ok') {
            polyline = L.geoJSON(data.routes[0].geometry, { style: { color: '#3498db', weight: 5, opacity: 0.8 } }).addTo(map);
        } else {
            polyline = L.polyline(coordsForMarker, {color: '#3498db', weight: 4, dashArray: '8, 8'}).addTo(map);
        }
    } catch(e) {
        polyline = L.polyline(coordsForMarker, {color: '#3498db', weight: 4, dashArray: '8, 8'}).addTo(map);
    }
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});

    // ✨ 路線畫完後，開始在路線周圍隨機「撒」幾個黃金景點
    setTimeout(() => generateNearbyCrawledPlaces(routeData), 500);
}

function generateNearbyCrawledPlaces(routeData) {
    // 隨機挑選 1~2 個路線中的點作為基準，在附近產生推薦點
    const basePoints = routeData.filter(p => p.type !== 'start' && p.type !== 'end');
    if (basePoints.length === 0) return;

    // 隨機打亂爬蟲資料庫
    const shuffledNearby = [...mockNearbyPlaces].sort(() => 0.5 - Math.random());
    const placesToSpawn = shuffledNearby.slice(0, 2); // 產生兩個周邊景點

    placesToSpawn.forEach((place, index) => {
        // 抓一個基準點，然後稍微偏移一下經緯度 (約 1~2 公里)
        const basePoint = basePoints[index % basePoints.length];
        const latOffset = (Math.random() - 0.5) * 0.03;
        const lngOffset = (Math.random() - 0.5) * 0.03;
        const finalLat = basePoint.lat + latOffset;
        const finalLng = basePoint.lng + lngOffset;

        // 在地圖上放置黃金 Marker
        const marker = L.marker([finalLat, finalLng], { icon: goldIcon }).addTo(map);
        
        // 製作點擊提示
        const popupContent = `
            <div style="font-size:13px; text-align:center;">
                <b>✨ AI 周邊發現 ✨</b><br>
                <b style="color:#d35400;">${place.name}</b><br>
                <button onclick="openPlaceDetail('${place.name}')" style="margin-top:5px; padding:3px 8px; font-size:12px; cursor:pointer; background:#f39c12; color:white; border:none; border-radius:3px;">查看爬蟲資訊</button>
            </div>
        `;
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

// --- 7. 打開第三頁詳細資訊 (由地圖 Popup 按鈕觸發) ---
window.openPlaceDetail = function(placeName) {
    // 從資料庫中找出該地點
    const place = mockNearbyPlaces.find(p => p.name === placeName);
    if (!place) return;

    // 填入第三頁的資料
    document.getElementById('detail-img').src = place.img;
    document.getElementById('detail-title').innerText = place.name;
    document.getElementById('detail-tag').innerText = place.tag;
    document.getElementById('detail-address').innerText = place.address;
    document.getElementById('detail-rating').innerText = `${place.rating} 顆星`;
    document.getElementById('detail-hours').innerText = place.hours;
    document.getElementById('detail-desc').innerText = place.desc;
    document.getElementById('detail-extra').innerHTML = place.extraInfo;
    document.getElementById('detail-reviews').innerHTML = place.reviews;

    // 切換頁面
    page2.classList.add('hidden');
    page3.classList.remove('hidden');
}

function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];
}