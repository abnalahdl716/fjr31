import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Check, X } from 'lucide-react';
import { getDeviceLocation } from '../utils/geo';

// Fix Leaflet's default marker icon paths in web bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  initialLat: number;
  initialLng: number;
  initialRadius: number;
  initialAddress: string;
  onSave: (location: { lat: number; lng: number; address: string; radius: number }) => void;
  onClose: () => void;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLat,
  initialLng,
  initialRadius,
  initialAddress,
  onSave,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [lat, setLat] = useState<number>(initialLat || 15.3694);
  const [lng, setLng] = useState<number>(initialLng || 44.1910);
  const [radius, setRadius] = useState<number>(initialRadius || 100);
  const [address, setAddress] = useState<string>(initialAddress || 'المقر الرئيسي لمؤسسة الفجر الخيرية');
  const [locating, setLocating] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create custom green marker
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: #16a34a; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
            <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);
      markerRef.current = marker;

      const circle = L.circle([lat, lng], {
        radius: radius,
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.18,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      // Click to move pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        setLat(newLat);
        setLng(newLng);
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
      });

      // Drag pin
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
        circle.setLatLng(position);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle radius dynamically
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  const handleGetCurrentLocation = async () => {
    setLocating(true);
    try {
      const loc = await getDeviceLocation();
      setLat(loc.lat);
      setLng(loc.lng);

      if (mapInstanceRef.current && markerRef.current && circleRef.current) {
        mapInstanceRef.current.setView([loc.lat, loc.lng], 17);
        markerRef.current.setLatLng([loc.lat, loc.lng]);
        circleRef.current.setLatLng([loc.lat, loc.lng]);
      }
    } catch (err: any) {
      alert(err.message || 'تعذر تحديد موقع الجهاز الحالي');
    } finally {
      setLocating(false);
    }
  };

  const handleSave = () => {
    onSave({
      lat,
      lng,
      address,
      radius,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <MapPin className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">تحديد موقع المنظمة ونصف قطر الـ GPS</h3>
              <p className="text-xs text-emerald-100">انقر على الخريطة لتحديد مقر المؤسسة بدقة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map View */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] bg-slate-100">
          <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" />
          
          {/* Geolocation Button overlay */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="absolute top-4 left-4 z-20 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl shadow-md flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
          >
            <Navigation className={`w-4 h-4 text-emerald-600 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'جاري التحديد...' : 'موقعي الحالي'}</span>
          </button>

          {/* Map Info Bar */}
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-xs border border-emerald-200/80 rounded-2xl p-2.5 shadow-md flex items-center justify-between text-xs text-slate-700">
            <span className="font-medium text-emerald-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>الإحداثيات: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
              نصف القطر: {radius} متر
            </span>
          </div>
        </div>

        {/* Radius & Address Settings Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم الموقع أو العنوان التفصيلي
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="مثال: المقر الرئيسي - شارع الزبيري"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                نصف قطر تسجيل الحضور المسموح به (GPS Radius):
              </label>
              <span className="font-mono-num font-extrabold text-emerald-700 text-sm">
                {radius} متر
              </span>
            </div>

            {/* Quick preset buttons as in specs: 50m, 100m, 200m */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[50, 100, 200, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRadius(preset)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    radius === preset
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset} متر
                </button>
              ))}
            </div>

            <input
              type="range"
              min="20"
              max="1000"
              step="10"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتطبيق الموقع</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
