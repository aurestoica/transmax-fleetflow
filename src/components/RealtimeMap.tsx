import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = L.divIcon({
  html: `<div style="background:hsl(var(--primary));color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">🚛</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  tripNumber?: string;
  driverName?: string;
  updatedAt?: string;
}

interface RealtimeMapProps {
  locations: MapLocation[];
  className?: string;
  center?: [number, number];
  zoom?: number;
  pickupCoords?: [number, number];
  deliveryCoords?: [number, number];
}

export default function RealtimeMap({ locations, className = '', center, zoom = 6, pickupCoords, deliveryCoords }: RealtimeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: center || [45.9432, 24.9668], // Romania center
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;
    markersRef.current.clearLayers();

    locations.forEach(loc => {
      const popup = `<div style="font-size:13px;line-height:1.4;">
        <strong>${loc.driverName || 'Șofer'}</strong>
        ${loc.tripNumber ? `<br/><span style="color:#666;">Cursa: ${loc.tripNumber}</span>` : ''}
        ${loc.updatedAt ? `<br/><span style="color:#999;font-size:11px;">${loc.updatedAt}</span>` : ''}
        <br/><span style="color:#999;font-size:11px;">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</span>
      </div>`;
      
      L.marker([loc.lat, loc.lng], { icon: truckIcon })
        .bindPopup(popup)
        .addTo(markersRef.current!);
    });

    // Add pickup/delivery markers if provided
    if (pickupCoords) {
      L.marker(pickupCoords, {
        icon: L.divIcon({
          html: `<div style="background:hsl(142,76%,36%);color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">📦</div>`,
          className: '', iconSize: [28, 28], iconAnchor: [14, 14],
        })
      }).bindPopup('Punct încărcare').addTo(markersRef.current!);
    }
    if (deliveryCoords) {
      L.marker(deliveryCoords, {
        icon: L.divIcon({
          html: `<div style="background:hsl(0,84%,60%);color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">🏁</div>`,
          className: '', iconSize: [28, 28], iconAnchor: [14, 14],
        })
      }).bindPopup('Punct descărcare').addTo(markersRef.current!);
    }

    // Auto-fit bounds
    const allPoints: [number, number][] = locations.map(l => [l.lat, l.lng]);
    if (pickupCoords) allPoints.push(pickupCoords);
    if (deliveryCoords) allPoints.push(deliveryCoords);

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [locations, pickupCoords, deliveryCoords]);

  return (
    <div ref={mapRef} className={`w-full rounded-xl border overflow-hidden relative z-0 ${className}`} style={{ minHeight: 350 }} />
  );
}
