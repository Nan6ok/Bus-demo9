const map = L.map('map').setView([22.3, 114.17], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let stopMarkers = [];
let busMarkers = [];

// 載入巴士路線
async function loadRoute(company, route) {
  clearMarkers();

  if (company === "kmb") {
    await loadKMB(route);
  } else {
    await loadCityBus(company, route);
  }
}

// 九巴 API
async function loadKMB(route) {
  const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route}/outbound/1`);
  const data = await res.json();

  document.getElementById('stopList').innerHTML = "";
  for (let stop of data.data) {
    const stopInfo = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop/${stop.stop}`);
    const stopData = await stopInfo.json();

    const li = document.createElement("li");
    li.textContent = stopData.data.name_tc + " (" + stopData.data.name_en + ")";
    document.getElementById('stopList').appendChild(li);

    let marker = L.marker([stopData.data.lat, stopData.data.long]).addTo(map)
      .bindPopup(stopData.data.name_en);
    stopMarkers.push(marker);
  }

  updateKMBPositions(route);
  setInterval(() => updateKMBPositions(route), 5000);
}

async function updateKMBPositions(route) {
  busMarkers.forEach(m => map.removeLayer(m));
  busMarkers = [];

  const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-eta/${route}/1/`);
  const data = await res.json();

  data.data.forEach(bus => {
    if (bus.eta_seq === 1 && bus.eta) {
      let marker = L.marker([bus.lat, bus.long], {
        icon: L.icon({
          iconUrl: 'assets/bus-icon.png',
          iconSize: [30, 30]
        })
      }).addTo(map)
        .bindPopup(`巴士 ${route}<br>車牌: ${bus.license_plate || "N/A"}`);
      busMarkers.push(marker);
    }
  });
}

// 城巴 / 新巴 API
async function loadCityBus(company, route) {
  const res = await fetch(`https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-stop/${company}/${route}/outbound`);
  const data = await res.json();

  document.getElementById('stopList').innerHTML = "";
  for (let stop of data.data) {
    const stopInfo = await fetch(`https://rt.data.gov.hk/v1/transport/citybus-nwfb/stop/${stop.stop}`);
    const stopData = await stopInfo.json();

    const li = document.createElement("li");
    li.textContent = stopData.data.name_tc + " (" + stopData.data.name_en + ")";
    document.getElementById('stopList').appendChild(li);

    let marker = L.marker([stopData.data.lat, stopData.data.long]).addTo(map)
      .bindPopup(stopData.data.name_en);
    stopMarkers.push(marker);
  }

  updateCityBusPositions(company, route);
  setInterval(() => updateCityBusPositions(company, route), 5000);
}

async function updateCityBusPositions(company, route) {
  busMarkers.forEach(m => map.removeLayer(m));
  busMarkers = [];

  const res = await fetch(`https://rt.data.gov.hk/v1/transport/citybus-nwfb/eta/${company}/${route}/all`);
  const data = await res.json();

  data.data.forEach(bus => {
    if (bus.eta) {
      let marker = L.marker([bus.lat, bus.long], {
        icon: L.icon({
          iconUrl: 'assets/bus-icon.png',
          iconSize: [30, 30]
        })
      }).addTo(map)
        .bindPopup(`巴士 ${route}<br>車牌: ${bus.license_plate || "N/A"}`);
      busMarkers.push(marker);
    }
  });
}

// 清除舊 marker
function clearMarkers() {
  stopMarkers.forEach(m => map.removeLayer(m));
  busMarkers.forEach(m => map.removeLayer(m));
  stopMarkers = [];
  busMarkers = [];
}

document.getElementById('loadBtn').addEventListener("click", () => {
  const company = document.getElementById('companySelect').value;
  const route = document.getElementById('routeInput').value.trim();
  if (route) loadRoute(company, route);
});
