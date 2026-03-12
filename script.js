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

// --- 修復：新增停靠站的按鈕邏輯 ---
document.getElementById('add-stop-btn').addEventListener('click', () => {
    const container = document.getElementById('waypoints-container');
    const div = document.createElement('div');
    div.className = 'waypoint-input';
    div.innerHTML = `
        <input type="text" placeholder="輸入停靠站 (例如：奇美博物館)" class="stop-input">
        <button class="remove-btn">刪除</button>
    `;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
});
// ---------------------------------

// 調整座標順序，確保由北到南或由南到北連線順暢
const mockDatabases = {
    food: [
        { name: "奇美博物館", address: "台南市仁德區文華路二段66號", lat: 22.9346, lng: 120.2265, time: "10:00 - 12:00", rating: "4.8", desc: "充滿歐洲風情的博物館，適合早上走走拍照。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "資料來源：Instagram 熱門打卡點" },
        { name: "國華街永樂市場", address: "台南市中西區國華街三段", lat: 22.9975, lng: 120.1982, time: "12:30 - 15:00", rating: "4.4", desc: "台南美食一級戰區。根據常態分配分析顯示，此區在午餐時段熱度達到峰值。", menu: "🍲 金得春捲 $50<br>🥣 富盛號碗粿 $35", img: "https://images.unsplash.com/photo-1541628951107-a9af5346a3e4?auto=format&fit=crop&q=80&w=600", source: "資料來源：Google Maps 綜合評價 / PTT Tainan 版" }
    ],
    sports: [
        { name: "蓮池潭風景區", address: "高雄市左營區蓮潭路", lat: 22.6841, lng: 120.2945, time: "09:30 - 11:30", rating: "4.5", desc: "環湖步道平緩，適合早晨暖身健走。", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=600", source: "資料來源：高雄旅遊網" },
        { name: "壽山國家自然公園", address: "高雄市鼓山區萬壽路", lat: 22.6465, lng: 120.2711, time: "13:00 - 16:30", rating: "4.6", desc: "擁有豐富獼猴生態。經爬蟲擷取論壇資料，此步道為南台灣週末熱度排名 Top 2。", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600", source: "資料來源：健行筆記 API" }
    ],
    leisure: [
        { name: "駁二藝術特區", address: "高雄市鹽埕區大勇路1號", lat: 22.6200, lng: 120.2818, time: "10:30 - 14:30", rating: "4.7", desc: "充滿文創氣息的舊倉庫群。數據顯示停留時間中位數高達 3 小時。", img: "https://images.unsplash.com/photo-1558281033-28723329f61b?auto=format&fit=crop&q=80&w=600", source: "資料來源：Google Maps 在地嚮導評論" },
        { name: "西子灣夕陽咖啡廳", address: "高雄市鼓山區蓮海路", lat: 22.6253, lng: 120.2655, time: "15:30 - 18:00", rating: "4.6", desc: "擁有絕佳落日海景。語意分析(NLP)顯示「放鬆」關鍵字頻率達 95%。", menu: "☕ 冰滴咖啡 $180<br>🍰 經典重乳酪蛋糕 $150", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600", source: "資料來源：Dcard 旅遊版" }
    ]
};

document.getElementById('submit-btn').addEventListener('click', () => generateRoute());
document.getElementById('refresh-btn').addEventListener('click', () => {
    const currentStyle = document.getElementById('travel-style').value;
    mockDatabases[currentStyle].reverse(); // 簡單反轉陣列製造重新規劃感
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

    // 擷取使用者輸入，若空則給預設名稱
    const userStart = document.getElementById('start-point').value.trim() || "使用者指定起點";
    const userEnd = document.getElementById('end-point').value.trim() || "使用者指定終點";
    const currentStyle = document.getElementById('travel-style').value;
    const baseRoute = mockDatabases[currentStyle];
    
    // --- 修復：確保起點、中間站、終點都有被推進陣列中 ---
    const finalRoute = [
        { name: userStart, address: "系統定位出發點", lat: 22.7293, lng: 120.3298, time: "09:00 - 09:30", rating: "-", desc: "行程準備開始！AI 已為您計算最佳避開壅塞的出發時間。", source: "資料來源：交通部即時路況 API" },
        ...baseRoute,
        // 把終點加進來，並給予一個合理的座標避免線亂折
        { name: userEnd, address: "最終目的地", lat: 22.9900, lng: 120.2000, time: "18:30 - 結束", rating: "-", desc: "順利抵達終點！整理今天的精采回憶。", source: "資料來源：Agent 預估時間" }
    ];

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
        const stepName = index === 0 ? "起點" : (index === routeData.length - 1 ? "終點" : `第 ${index} 站`);
        let extraHTML = '';
        if (stop.menu) extraHTML += `<div class="menu-box"><b>📖 熱門菜單/推薦：</b><br>${stop.menu}</div>`;
        if (stop.img) extraHTML += `<img src="${stop.img}" class="place-img" alt="${stop.name}">`;

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
        if(index === 1) marker.openPopup(); // 預設打開中間第一站的標記
    });
    
    // 畫線
    polyline = L.polyline(coords, {color: '#e74c3c', weight: 4, dashArray: '8, 8'}).addTo(map);
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
}

function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];
}