import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report, FireHotspot, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

// Fix default Leaflet marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCategoryIcon = (category: string) => {
  const colorMap: Record<string, string> = {
    wildfire: '#ef4444',
    illegal_logging: '#92400e',
    water_leak: '#3b82f6',
    pollution: '#6b7280',
  };
  const emojiMap: Record<string, string> = {
    wildfire: '🔥',
    illegal_logging: '🪵',
    water_leak: '💧',
    pollution: '☁️',
  };
  const color = colorMap[category] || '#6b7280';
  const emoji = emojiMap[category] || '📍';

  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const hotspotIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ff4500;border-radius:50%;width:20px;height:20px;border:2px solid #fff;box-shadow:0 0 8px rgba(255,69,0,0.8);animation:pulse 2s infinite;opacity:0.9;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

interface RecenterProps {
  lat: number;
  lon: number;
}

const Recenter: React.FC<RecenterProps> = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);
  return null;
};

interface MapViewProps {
  reports?: Report[];
  hotspots?: FireHotspot[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
}

const MapClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => onClick(e.latlng.lat, e.latlng.lng);
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, onClick]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({
  reports = [],
  hotspots = [],
  height = '100%',
  center = [33.5228, -5.1071],
  zoom = 11,
  onMapClick,
  selectedLocation,
}) => {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    verified: '#3b82f6',
    resolved: '#22c55e',
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {onMapClick && <MapClickHandler onClick={onMapClick} />}

      {reports.map((report) => (
        <Marker
          key={report._id}
          position={[report.latitude, report.longitude]}
          icon={createCategoryIcon(report.category)}
        >
          <Popup maxWidth={240}>
            <div className="p-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span>{CATEGORY_ICONS[report.category]}</span>
                <span className="text-xs font-medium text-slate-500 uppercase">
                  {CATEGORY_LABELS[report.category]}
                </span>
              </div>
              <p className="font-semibold text-slate-800 text-sm mb-1">{report.title}</p>
              <p className="text-xs text-slate-500 mb-2 line-clamp-3">{report.description}</p>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: statusColors[report.status] + '20', color: statusColors[report.status] }}
                >
                  {report.status}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(report.createdAt).toLocaleDateString('fr-MA')}
                </span>
              </div>
              {report.imageUrl && (
                <img
                  src={report.imageUrl}
                  alt={report.title}
                  className="w-full h-24 object-cover rounded mt-2"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {hotspots.map((h, i) => (
        <Marker key={`hotspot-${i}`} position={[h.latitude, h.longitude]} icon={hotspotIcon}>
          <Popup maxWidth={200}>
            <div className="p-1">
              <p className="font-semibold text-red-700 text-sm mb-1">🔥 Fire Hotspot</p>
              <p className="text-xs text-slate-600">Brightness: {h.brightness.toFixed(0)} K</p>
              <p className="text-xs text-slate-600">Confidence: {h.confidence}%</p>
              <p className="text-xs text-slate-600">FRP: {h.frp.toFixed(1)} MW</p>
              <p className="text-xs text-slate-400 mt-1">
                {h.acquiredDate} · {h.satellite} satellite
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {selectedLocation && (
        <Marker
          position={selectedLocation}
          icon={L.divIcon({
            className: '',
            html: `<div style="background:#16a34a;border-radius:50%;width:16px;height:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        />
      )}
    </MapContainer>
  );
};

export default MapView;
