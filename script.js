// 初始化地圖
const map = L.map('map').setView([22.7293, 120.3298], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let polyline = null;

const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const loading = document.getElementById('loading');
const itineraryContent = document.getElementById('itinerary-content');
const itineraryList = document.getElementById('itinerary-list');

// 根據不同風格準備詳盡的 Mock 數據庫
const mockDatabases = {
    food: [
        { name: "國華街永樂市場", address: "台南市中西區國華街三段", lat: 22.9975, lng: 120.1982, time: "11:00 - 13:30", rating: "4.4", 
          desc: "台南美食一級戰區。根據社群大數據常態分配分析顯示，此區在午餐時段的討論熱度與打卡數達到極端峰值，強烈推薦排入首站。", 
          menu: "🍲 金得春捲 $50<br>🥣 富盛號碗粿 $35", 
          img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "資料來源：Google Maps 綜合評價 / PTT Tainan 版統計" },
        { name: "安平老街", address: "台南市安平區延平街", lat: 23.0007, lng: 120.1609, time: "14:30 - 17:00", rating: "4.3", 
          desc: "台灣最古老的街道。統計分析指出，超過 80% 的觀光客會在此購買蝦餅與蜜餞，符合典型 80/20 推薦法則。", 
          img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=600", source: "資料來源：Instagram 繁體中文熱門標籤分析" }
    ],
    sports: [
        { name: "壽山國家自然公園 (柴山步道)", address: "高雄市鼓山區萬壽路", lat: 22.6465, lng: 120.2711, time: "09:00 - 12:30", rating: "4.6", 
          desc: "擁有豐富獼猴生態與石灰岩地形。經爬蟲擷取「健行筆記」論壇近萬筆資料，此步道為南台灣週末熱度排名 Top 2。", 
          img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "資料來源：健行筆記 API / 林務局公開數據" },
        { name: "旗津踩風大道 (自行車)", address: "高雄市旗津區", lat: 22.6074, lng: 120.2678, time: "14:00 - 16:30", rating: "4.5", 
          desc: "沿著海岸線騎乘，海風徐徐。大數據顯示下午時段微氣候最為宜人，非常適合進行中等強度的有氧運動。", 
          img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600", source: "資料來源：Strava 騎乘熱區統計 / 氣象局資料" }
    ],
    leisure: [
        { name: "駁二藝術特區", address: "高雄市鹽埕區大勇路1號", lat: 22.6200, lng: 120.2818, time: "10:30 - 13:30", rating: "4.7", 
          desc: "充滿文創氣息的舊倉庫群。數據顯示停留時間中位數高達 3 小時，適合不趕行程的深度放鬆者。", 
          img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "資料來源：Google Maps 在地嚮導評論分析" },
        { name: "西子灣夕陽咖啡廳", address: "高雄市鼓山區蓮海路", lat: 22.6253, lng: 120.2655, time: "16:00 - 18:30", rating: "4.6", 
          desc: "擁有絕佳落日海景。透過語意分析 (NLP) 處理網路評價，「放鬆」、「絕美」等關鍵字出現頻率超過 95%。", 
          menu: "☕ 冰滴咖啡 $180<br>🍰 經典重乳酪蛋糕 $150", 
          img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600", source: "資料來源：Google Maps 圖片爬蟲 / Dcard 旅遊版" }
    ]
};

document.getElementById('submit-btn').addEventListener('click', () => {
    generateRoute();
});

document.getElementById('refresh-btn').addEventListener('click', () => {
    // 簡單的陣列反轉模擬「刷新不同路線」，在 MVP 中很實用
    const currentStyle = document.getElementById('travel-style').value;
    mockDatabases[currentStyle].reverse(); 
    generateRoute();
});

document.getElementById('back-btn').addEventListener('click', () => {
    page2.classList.add('hidden');
    page1.classList.remove('hidden');
    clearMap();
    map.setView([22.7293, 120.3298], 10);
});

function generateRoute() {
    page1.classList.add('hidden');
    page2.classList.remove('hidden');
    itineraryContent.classList.add('hidden');
    loading.classList.remove('hidden');
    clearMap();

    // 擷取使用者輸入的起點，若空則預設「出發地」
    const userStart = document.getElementById('start-point').value.trim() || "使用者指定起點";
    const currentStyle = document.getElementById('travel-style').value;
    
    // 組合最終路線：起點 + 中間行程 + 終點 (這裡簡化終點處理)
    const baseRoute = mockDatabases[currentStyle];
    const finalRoute = [
        { name: userStart, address: "系統定位位置", lat: 22.7293, lng: 120.3298, time: "08:00 - 08:30", rating: "-", desc: "行程準備開始！AI 已為您計算最佳避開壅塞的出發時間。", source: "資料來源：交通部即時路況 API" },
        ...baseRoute
    ];

    setTimeout(() => {
        loading.classList.add('hidden');
        itineraryContent.classList.remove('hidden');
        renderItinerary(finalRoute);
        drawMap(finalRoute);
    }, 1800); // 1.8秒動畫
}

function renderItinerary(routeData) {
    itineraryList.innerHTML = ''; 
    
    routeData.forEach((stop, index) => {
        const stepName = index === 0 ? "起點" : `第 ${index} 站`;
        let extraHTML = '';
        
        if (stop.menu) {
            extraHTML += `<div class="menu-box"><b>📖 熱門菜單/推薦：</b><br>${stop.menu}</div>`;
        }
        if (stop.img) {
            extraHTML += `<img src="${stop.img}" class="place-img" alt="${stop.name}">`;
        }

        const html = `
            <details ${index === 1 ? 'open' : ''}>
                <summary><span class="time-badge">${stop.time}</span> ${stepName}：${stop.name}</summary>
                <div class="stop-info">
                    <p><b>📍 地址：</b>${stop.address}</p>
                    <p><b>⭐ Google 評分：</b><span class="rating">${stop.rating} 顆星</span></p>
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
    routeData.forEach((stop, index) => {
        const coord = [stop.lat, stop.lng];
        coords.push(coord);
        
        const popupContent = `
            <div style="font-size:14px;">
                <b>${stop.time}</b><br>
                <b>${stop.name}</b><br>
                <span style="color:gray; font-size:12px;">${stop.address}</span><br>
                ⭐ ${stop.rating}
            </div>
        `;
        const marker = L.marker(coord).addTo(map).bindPopup(popupContent);
        markers.push(marker);
        if(index === 1) marker.openPopup();
    });
    
    polyline = L.polyline(coords, {color: '#e74c3c', weight: 4, dashArray: '8, 8'}).addTo(map);
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
}

function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];
}