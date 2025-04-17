let map;
let markers = [];
let directionsRenderer;
let directionsService;
let clickPath = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("googleMap"), {
    center: { lat: 51.508742, lng: -0.120850 },
    zoom: 5,
    mapId: "6a25adca58142b99"
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  document.getElementById("addMarkerForm").addEventListener("submit", handleFormSubmit);

  map.addListener("click", async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const content = prompt("Enter marker label/info:");

    if (content) {
      const position = { lat, lng };
      addAdvancedMarker(position, content);
      await saveMarkerToDB(position, content);
      fetchAndDisplaySavedLocations();

      clickPath.push({ position, content });

      if (clickPath.length === 2) {
        drawRoute(clickPath[0].position, clickPath[1].position);
        clickPath = [];
      }
    }
  });

  loadSavedMarkers();
  fetchAndDisplaySavedLocations();
}

function handleFormSubmit(e) {
  e.preventDefault();

  const lat1 = parseFloat(document.getElementById("latitude1").value);
  const lng1 = parseFloat(document.getElementById("longitude1").value);
  const lat2 = parseFloat(document.getElementById("latitude2").value);
  const lng2 = parseFloat(document.getElementById("longitude2").value);
  const content1 = document.getElementById("content1").value.trim();
  const content2 = document.getElementById("content2").value.trim();

  if (
    isNaN(lat1) || isNaN(lng1) ||
    isNaN(lat2) || isNaN(lng2) ||
    !content1 || !content2
  ) {
    alert("Please enter valid coordinates and content.");
    return;
  }

  clearMarkers();
  directionsRenderer.setDirections({ routes: [] });

  const positionA = { lat: lat1, lng: lng1 };
  const positionB = { lat: lat2, lng: lng2 };

  addAdvancedMarker(positionA, content1);
  addAdvancedMarker(positionB, content2);

  saveMarkerToDB(positionA, content1);
  saveMarkerToDB(positionB, content2);

  const bounds = new google.maps.LatLngBounds();
  bounds.extend(positionA);
  bounds.extend(positionB);
  map.fitBounds(bounds);

  drawRoute(positionA, positionB);
  fetchAndDisplaySavedLocations();
}

function addAdvancedMarker(position, infoText) {
  const infoWindow = new google.maps.InfoWindow({ content: infoText });

  const marker = new google.maps.marker.AdvancedMarkerElement({
    position,
    map,
    title: infoText,
  });

  marker.addListener("gmp-click", () => {
    infoWindow.open({
      anchor: marker,
      map,
    });
  });

  markers.push(marker);
}

function clearMarkers() {
  markers.forEach(marker => marker.map = null);
  markers = [];
}

function drawRoute(origin, destination) {
  directionsService.route(
    {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        console.error("Directions request failed due to " + status);
        alert("Could not retrieve directions: " + status);
      }
    }
  );
}

async function saveMarkerToDB(position, content) {
  await fetch('/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: position.lat, lng: position.lng, content })
  });
}

async function loadSavedMarkers() {
  clearMarkers();
  const res = await fetch('/locations');
  const locations = await res.json();
  locations.forEach(loc => {
    addAdvancedMarker({ lat: loc.lat, lng: loc.lng }, loc.content);
  });
}

async function fetchAndDisplaySavedLocations() {
  const res = await fetch('/locations');
  const locations = await res.json();

  const list = document.getElementById('locationsList');
  list.innerHTML = '';

  locations.forEach(loc => {
    const li = document.createElement('li');
    li.style.marginBottom = '1em';

    li.innerHTML = `
      <strong>${loc.content}</strong><br>
      Lat: ${loc.lat.toFixed(5)}, Lng: ${loc.lng.toFixed(5)}<br>
      <button onclick="zoomToLocation(${loc.lat}, ${loc.lng})">Zoom</button>
      <button onclick="deleteLocation(${loc.id})" style="color: red;">Delete</button>
    `;

    list.appendChild(li);
  });
}

function zoomToLocation(lat, lng) {
  const position = { lat, lng };
  map.setZoom(10);
  map.panTo(position);
}

async function deleteLocation(id) {
  if (!confirm("Are you sure you want to delete this location?")) return;

  await fetch(`/locations/${id}`, { method: 'DELETE' });
  fetchAndDisplaySavedLocations();
  loadSavedMarkers();
}
