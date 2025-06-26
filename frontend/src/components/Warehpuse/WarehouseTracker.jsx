// src/components/Warehouse/WarehouseTracker.jsx
import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  useMap
} from 'react-leaflet';

import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

// ① this little component will pan/zoom whenever `position` changes
function Recenter({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, zoom);
  }, [position, zoom, map]);
  return null;
}

export default function WarehouseTracker() {
  const [params]    = useSearchParams();
  const warehouseId = params.get('id');
  const token       = localStorage.getItem('token');
  const apiUrl      = `http://localhost:5000/api/warehouse-location/${warehouseId}`;

  // default fallback to Lucknow center
  const [position, setPosition] = useState({ lat: 26.8467, lng: 80.9462 });

  useEffect(() => {
    if (!warehouseId) return;
    const fetchLocation = async () => {
      try {
        const { data } = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const [lng, lat] = data.data.coords.coordinates;
        setPosition({ lat, lng });
      } catch (err) {
        console.error('fetchLocation error:', err);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);  // poll every 5s
    return () => clearInterval(interval);
  }, [warehouseId, apiUrl, token]);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={position}
        zoom={17}                           // ← closer zoom
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* ① keeps map in sync with `position` */}
        <Recenter position={position} zoom={17} />

        {/* ② OSM Tiles */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* ③ a red circle “target” ring: */}
        <CircleMarker
          center={position}
          radius={12}
          pathOptions={{ color: 'red', weight: 3, fill: false }}
        />

        {/* ④ optional: default pin marker too */}
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}
