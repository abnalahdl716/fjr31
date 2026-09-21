/**
 * Geolocation & Distance Calculation (Haversine Formula)
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(point1: LatLng, point2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Requests device geolocation via HTML5 Geolocation API
 */
export async function getDeviceLocation(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('خدمة تحديد الموقع (GPS) غير مدعومة في متصفحك'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 10),
        });
      },
      (error) => {
        let msg = 'تعذر الحصول على إذن الموقع الجغرافي';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'تم رفض إذن الوصول إلى موقع الجهاز من قبل المستخدم أو إعدادات المتصفح';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'معلومات الموقع غير متوفرة حالياً';
        } else if (error.code === error.TIMEOUT) {
          msg = 'انتهت مهلة طلب تحديد الموقع';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
