import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Check, X, LocateFixed, Sparkles, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
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
  autoLocateOnOpen?: boolean; // خيار فتح الخارطة وتحديد موقع التواجد فوراً
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
  const [radius, setRadius] = useState<number>(initialRadius || 100);
  const [address, setAddress] = useState<string>(
    initialAddress || 'المقر الرئيسي لمؤسسة الفجر الخيرية'
  );
  const [locating, setLocating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showTroubleshoot, setShowTroubleshoot] = useState<boolean>(false);

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
          <div style="background-color: #16a34a; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
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
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      // Click anywhere on the map to move pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        setLat(newLat);
        setLng(newLng);
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        setStatusMessage('تم نقل المؤشر إلى الموقع المحدد على الخريطة');
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

      // If autoLocateOnOpen is requested, automatically trigger GPS detection
      if (autoLocateOnOpen) {
        setTimeout(() => {
          handleGetCurrentLocation();
        }, 400);
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
      setAddress((prev) =>
        prev.includes('موقع المقر الحالي')
          ? prev
          : `مقر المؤسسة (موقع تواجد المدير - دقة ±${loc.accuracy}م)`
      );

      if (mapInstanceRef.current && markerRef.current && circleRef.current) {
        mapInstanceRef.current.setView([preciseLat, preciseLng], 17, {
          animate: true,
        });
        markerRef.current.setLatLng([preciseLat, preciseLng]);
        circleRef.current.setLatLng([preciseLat, preciseLng]);
      }

      setStatusMessage(`تم تحديد وتثبيت موقع تواجدك الحالي بنجاح (دقة ±${loc.accuracy}م)`);
    } catch (err: any) {
      const msg = err?.message || 'تعذر الوصول إلى الموقع الجغرافي للجهاز';
      setErrorMessage(msg);
      setStatusMessage('');
      setShowTroubleshoot(true);
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
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-xl shadow-2xs">
              <MapPin className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>تحديد وتثبيت موقع المقر على الخريطة</span>
                {autoLocateOnOpen && (
                  <span className="text-[10px] bg-amber-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    تحديد فوري
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-100">
                تفتح الخريطة وتحدد الموقع المتواجد فيه المقر لحساب بصمة الموظفين
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

        {/* Map View */}
        <div className="relative flex-1 min-h-[320px] sm:min-h-[400px] bg-slate-100">
          <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" />

          {/* Quick Auto GPS Button Overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <button
              type="button"
              id="map-locate-me-btn"
              onClick={handleGetCurrentLocation}
              disabled={locating}
              className="bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-500 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
              title="تحديد الموقع الجغرافي تلقائياً حسب تواجدك الآن"
            >
              <LocateFixed className={`w-4 h-4 ${locating ? 'animate-spin text-amber-300' : ''}`} />
              <span>{locating ? 'جاري تحديد موقعك...' : 'تحديد الموقع من موقعي الحالي'}</span>
            </button>
          </div>

          {/* Real-time Status / Notification overlay */}
          {statusMessage && (
            <div className="absolute top-4 right-4 z-20 max-w-[320px] bg-white/95 backdrop-blur-md border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-xl shadow-md text-xs font-bold animate-fadeIn flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Message & Troubleshooting Guide Overlay */}
          {errorMessage && (
            <div className="absolute top-4 right-4 left-4 sm:left-auto sm:max-w-[420px] z-30 bg-white/98 backdrop-blur-md border border-amber-300 text-slate-800 p-3.5 rounded-2xl shadow-xl animate-fadeIn space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-extrabold text-xs text-amber-900">
                      لماذا تعذر تحديد الموقع التلقائي؟
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      {errorMessage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Troubleshooting Instructions */}
              <div className="bg-amber-50/80 rounded-xl p-2.5 text-[11px] text-amber-950 space-y-1.5 border border-amber-200/60">
                <div className="font-bold flex items-center gap-1 text-amber-800">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>خطوات سريعة للحل:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pr-1">
                  <li>
                    <strong>إذن المتصفح:</strong> اضغط على أيقونة 🔒 (القفل) بجانب عنوان الموقع بالأعلى، وتأكد من تفعيل خيار <strong>الموقع (Location)</strong> إلى <strong>سماح (Allow)</strong>.
                  </li>
                  <li>
                    <strong>تفعيل GPS:</strong> تأكد من تشغيل "الموقع" في شريط إشعارات الهاتف أو إعدادات الجهاز.
                  </li>
                  <li>
                    <strong>الحل اليدوي السريع:</strong> يمكنك النقر مباشرة على أي نقطة على الخريطة أو سحب المؤشر الأخضر إلى موقع المقر وتثبيته فوراً دون الحاجة للـ GPS.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            </div>
          )}

          {/* Map Info Bar */}
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-xs border border-emerald-200/80 rounded-2xl p-2.5 shadow-md flex items-center justify-between text-xs text-slate-700">
            <span className="font-medium text-emerald-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>
                موقع المقر: {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-lg border border-emerald-200">
              نصف قطر النطاق: {radius} متر
            </span>
          </div>
        </div>

        {/* Radius & Address Settings Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم موقع المقر أو وصف العنوان
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="مثال: المقر الرئيسي لمؤسسة الفجر الخيرية الاجتماعية"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                نطاق تسجيل الحضور المسموح به حول المقر (GPS Radius):
              </label>
              <span className="font-mono-num font-extrabold text-emerald-700 text-sm">
                {radius} متر
              </span>
            </div>

            {/* Quick preset buttons: 50m, 100m, 200m, 500m */}
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
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
            <span className="text-[11px] text-slate-500">
              * سيتم اعتماد هذا الموقع كمرجع وحيد لحضور الموظفين فور الحفظ
            </span>
            <div className="flex items-center gap-2">
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
                <span>تأكيد وحفظ موقع المقر</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
