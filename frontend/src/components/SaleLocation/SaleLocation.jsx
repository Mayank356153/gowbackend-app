import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import L from "leaflet";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

/* Handle click to set startPoint */
function ClickHandler({ setStartPoint }) {
  useMapEvents({
    click(e)  {
      setStartPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/* Utility: Distance in KM */
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* Utility: Fit map bounds */
const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

/* ORS Routing function */
const fetchRouteORS = async (start, end, setPath) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/way`, {
      headers:{Authorization: `Bearer ${localStorage.getItem("token")}`},
      params: {
        start: `${start[1]},${start[0]}`,
        end: `${end[1]},${end[0]}`,
      },
    });

    const coords = response.data.features[0].geometry.coordinates.map(
      ([lng, lat]) => [lat, lng]
    );
    setPath(coords);
  } catch (err) {
    console.error("ORS routing error (via backend):", err);
  }
};


export default function SaleLocation() {
  const link="https://pos.inspiredgrow.in/vps"
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [bills, setBills] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [startPoint, setStartPoint] = useState(null);
  const [circleRadius, setCircleRadius] = useState(2);
  const [route, setRoute] = useState([]);

  const origin = startPoint || currentLocation;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("Geo error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    axios
      .get(`${link}/api/warehouses?scope=mine`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => setWarehouses(data.data || []));
  }, []);

  useEffect(() => {
    const fetchBills = async () => {
      const { data } = await axios.get(`${link}/api/pos/invoices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const filtered = data.filter((b) => {
        if (!Array.isArray(b.location) || b.location.length !== 2) return false;
        const dist = getDistanceInKm(origin[0], origin[1], b.location[0], b.location[1]);
        const billDate = b.saleDate?.split("T")[0];
        const inRange = (!dateFrom || billDate >= dateFrom) && (!dateTo || billDate <= dateTo);
        const matchWarehouse = !selectedWarehouse || b.warehouse._id === selectedWarehouse;
        return dist <= circleRadius && inRange && matchWarehouse;
      });

      setBills(filtered);
    };

    if (origin) fetchBills();
  }, [origin, circleRadius, selectedWarehouse, dateFrom, dateTo]);

  const groupedMarkers = Object.values(
    bills.reduce((acc, bill) => {
      const key = `${bill.location[0]}-${bill.location[1]}`;
      acc[key] = acc[key] || { lat: bill.location[0], lng: bill.location[1], bills: [] };
      acc[key].bills.push(bill);
      return acc;
    }, {})
  );

  const bounds = origin ? [origin, ...groupedMarkers.map((g) => [g.lat, g.lng])] : [];

  // Fetch actual road route to first bill
  useEffect(() => {
    if (startPoint && groupedMarkers.length > 0) {
      const end = [groupedMarkers[0].lat, groupedMarkers[0].lng];
      fetchRouteORS(startPoint, end, setRoute);
    }
  }, [startPoint, groupedMarkers]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-100 border-r">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>

        <div className="relative flex-1">
          {/* Filters */}
          <div className="absolute top-4 left-8 z-[1000] bg-white p-4 rounded shadow w-72 text-sm space-y-2">
            <label>Warehouse:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full p-1 border rounded"
            >
              <option value="">All</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.warehouseName}
                </option>
              ))}
            </select>
            <label>Date From:</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full p-1 border rounded" />
            <label>Date To:</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full p-1 border rounded" />
            <label>Radius (km):</label>
            <input type="number" value={circleRadius} onChange={(e) => setCircleRadius(Number(e.target.value))} className="w-full p-1 border rounded" />
          </div>

          {/* Map */}
          <div className="w-full h-full">
            <MapContainer center={currentLocation || [29.1489, 75.7217]} zoom={15} style={{ height: "100%", width: "100%" }}>
              <ClickHandler setStartPoint={setStartPoint} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {bounds.length > 0 && <FitBounds bounds={bounds} />}

              {origin && (
                <Marker
                  position={origin}
                  icon={L.icon({
                    iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                  })}
                >
                  <Popup>Start Point</Popup>
                </Marker>
              )}

              {currentLocation && (
                <Marker
                  position={currentLocation}
                  icon={L.icon({
                    iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447035.png",
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                  })}
                >
                  <Popup>Your Location</Popup>
                </Marker>
              )}

              { currentLocation && (
                <Circle
                  center={currentLocation}
                  radius={circleRadius * 1000}
                  pathOptions={{ color: "red", fillColor: "#f03", fillOpacity: 0.3 }}
                />
              )}

              {route.length > 1 && <Polyline positions={route} color="blue" weight={4} />}

              {groupedMarkers.map((group, idx) => (
                <Marker
                  key={idx}
                  position={[group.lat, group.lng]}
                  icon={L.icon({
                    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                >
                  <Popup>
                    <strong>{group.bills.length} Bills</strong>
                    <hr />
                    {group.bills.map((b, i) => (
                      <div key={i} style={{ fontSize: 12 }}>
                        <div><strong>Date:</strong> {new Date(b.saleDate).toLocaleDateString()}</div>
                        <div><strong>Amount:</strong> ₹{b.amount?.toFixed(2)}</div>
                      </div>
                    ))}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
