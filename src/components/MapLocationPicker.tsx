import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Check, X, LocateFixed, Sparkles, AlertCircle, RefreshCw, Compass } from 'lucide-react';
import { getDeviceLocation, parseCoordinatesFromInput } from '../utils/geo';

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
  autoLocateOnOpen?: boolean;
  onSave: (location: { lat: number; lng: number; address: string; radius: number }) => void;
  onClose: () => void;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLat,
  initialLng,
  initialRadius,
  initialAddress,
  autoLocateOnOpen = false,
  onSave,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [lat, setLat] = useState<number>(initialLat || 15.3694);
  const [lng, setLng] = useState<number>(initialLng || 44.1910);
  const [radius, setRadius] = useState<number>(initialRadius || 150);
  const [address, setAddress] = useState<string>(
    initialAddress || 'المقر الرئيسي لمؤسسة الفجر الخيرية الاجتماعية'
  );
  const [locating, setLocating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pastedUrl, setPastedUrl] = useState<string>('');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom green pin icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: #059669; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
            <div style="width: 12px; height: 12px; background-color: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);
      markerRef.current = marker;

      const circle = L.circle([lat, lng], {
        radius: radius,
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.2,
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
        setStatusMessage('تم نقل موقع المقر بنجاح إلى المكان المحدد على الخريطة');
      });

      // Drag pin
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
        circle.setLatLng(position);
        setStatusMessage('تم تعديل موقع المقر بنجاح');
      });

      mapInstanceRef.current = map;

      if (autoLocateOnOpen) {
        setTimeout(() => {
          handleGetCurrentLocation();
        }, 300);
      }
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
    setErrorMessage('');
    setStatusMessage('جاري محاولة التقاط إحداثيات جهازك بدقة...');
    try {
      const loc = await getDeviceLocation();
      const preciseLat = Number(loc.lat.toFixed(6));
      const preciseLng = Number(loc.lng.toFixed(6));

      setLat(preciseLat);
      setLng(preciseLng);
      setErrorMessage('');

      if (mapInstanceRef.current && markerRef.current && circleRef.current) {
        mapInstanceRef.current.setView([preciseLat, preciseLng], 17, { animate: true });
        markerRef.current.setLatLng([preciseLat, preciseLng]);
        circleRef.current.setLatLng([preciseLat, preciseLng]);
      }

      setStatusMessage(`تم تحديد موقعك الحالي بنجاح (دقة ±${loc.accuracy}م) عبر الشبكة / GPS`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر جلب الموقع الجغرافي');
      setStatusMessage('');
    } finally {
      setLocating(false);
    }
  };

  const handlePasteGoogleMaps = () => {
    if (!pastedUrl) return;
    const parsed = parseCoordinatesFromInput(pastedUrl);
    if (parsed) {
      const preciseLat = Number(parsed.lat.toFixed(6));
      const preciseLng = Number(parsed.lng.toFixed(6));
      setLat(preciseLat);
      setLng(preciseLng);
      setErrorMessage('');
      setStatusMessage(`تم استخراج الإحداثيات بنجاح (${preciseLat}, ${preciseLng})`);

      if (mapInstanceRef.current && markerRef.current && circleRef.current) {
        mapInstanceRef.current.setView([preciseLat, preciseLng], 17, { animate: true });
        markerRef.current.setLatLng([preciseLat, preciseLng]);
        circleRef.current.setLatLng([preciseLat, preciseLng]);
      }
      setPastedUrl('');
    } else {
      setErrorMessage('تعذر استخراج الإحداثيات من الرابط. تأكد من نسخ رابط صالح من خرائط جوجل أو إدخال أرقام الإحداثيات.');
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
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-xl shadow-xs">
              <MapPin className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>تحديد موقع المقر على الخريطة</span>
              </h3>
              <p className="text-xs text-emerald-100">
                حدد موقع المؤسسة على الخريطة لتثبيت النطاق الجغرافي لبصمة الحضور
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick GPS & Map Link Tools Bar */}
        <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {locating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <LocateFixed className="w-4 h-4 text-amber-300" />
            )}
            <span>التقاط موقعي الحالي تلقائياً</span>
          </button>

          {/* Paste Google Maps link or coordinates */}
          <div className="flex items-center gap-1.5 flex-1 max-w-md">
            <input
              type="text"
              value={pastedUrl}
              onChange={(e) => setPastedUrl(e.target.value)}
              placeholder="ألصق رابط خرائط جوجل أو إحداثيات (مثال: 15.3694, 44.1910)"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handlePasteGoogleMaps}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer"
            >
              تطبيق
            </button>
          </div>
        </div>

        {/* Map View */}
        <div className="relative w-full h-64 sm:h-80 bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Status Alert */}
          {statusMessage && (
            <div className="absolute top-2 left-2 right-2 z-20 bg-emerald-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="absolute top-2 left-2 right-2 z-20 bg-rose-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Info Badge */}
          <div className="absolute bottom-2 left-2 right-2 z-20 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-xl p-2 shadow-md flex items-center justify-between text-xs text-slate-700">
            <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>الموقع: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
              نصف القطر: {radius} متر
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم موقع المقر أو وصف العنوان
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="مثال: المقر الرئيسي لمؤسسة الفجر الخيرية الاجتماعية"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                نطاق الحضور المسموح به حول المقر (Radius):
              </label>
              <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                {radius} متر
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {[50, 100, 150, 300].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRadius(preset)}
                  className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    radius === preset
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset} م
                </button>
              ))}
            </div>

            <input
              type="range"
              min="30"
              max="1000"
              step="10"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              * يعمل الحضور على أي شبكة إنترنت (شريحة / واي فاي / ADSL / ستارلنك)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ الموقع</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
