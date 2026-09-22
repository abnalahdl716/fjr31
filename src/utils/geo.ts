/**
 * Geolocation & Universal Network Utilities (Data / Wi-Fi / ADSL / Starlink)
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
 * Detects current network type / connection status for display
 * Supports Mobile Data (4G/5G/3G), Wi-Fi, ADSL, Starlink Satellite
 */
export function detectNetworkInfo(): { type: string; isOnline: boolean; downlink?: number } {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!conn) {
    return {
      type: 'شبكة الإنترنت متصلة (بيانات / واي فاي / ADSL)',
      isOnline,
    };
  }

  let networkName = 'واي فاي / ADSL / ستارلنك';
  if (conn.type === 'cellular') {
    networkName = `بيانات الجوال (${conn.effectiveType ? conn.effectiveType.toUpperCase() : 'شريحة'})`;
  } else if (conn.effectiveType === '4g' || conn.effectiveType === '3g') {
    networkName = `بيانات الجوال / شبكة سريعة (${conn.effectiveType.toUpperCase()})`;
  } else if (conn.type === 'wifi') {
    networkName = 'شبكة واي فاي (Wi-Fi)';
  }

  return {
    type: networkName,
    isOnline,
    downlink: conn.downlink,
  };
}

/**
 * Requests device geolocation via HTML5 Geolocation API with robust fallback.
 * Operates over any network (Mobile Data, Wi-Fi, ADSL, Starlink, Offline GPS).
 */
export async function getDeviceLocation(): Promise<{ lat: number; lng: number; accuracy: number }> {
  if (!navigator.geolocation) {
    throw new Error('خدمة تحديد الموقع (GPS) غير مدعومة في جهازك أو متصفحك');
  }

  // Attempt 1: High Accuracy (GPS hardware)
  try {
    return await queryPosition({
      enableHighAccuracy: true,
      timeout: 9000,
      maximumAge: 30000,
    });
  } catch (err: any) {
    // If permission was denied, do not retry, inform user immediately
    if (err?.code === 1 || err?.message?.includes('إذن الموقع')) {
      throw err;
    }

    // Attempt 2: Fallback to Network positioning (Cellular/Wi-Fi/ADSL IP location)
    try {
      return await queryPosition({
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 60000,
      });
    } catch (fallbackErr: any) {
      throw fallbackErr;
    }
  }
}

function queryPosition(options: PositionOptions): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 15),
        });
      },
      (error) => {
        let msg = 'تعذر تحديد الموقع الجغرافي';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'لم يتم منح إذن الموقع. اضغط على أيقونة القفل 🔒 أو إعدادات المتصفح واختر "السماح بالوصول للموقع" (Allow Location).';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'إشارة الموقع (GPS) غير متوفرة حالياً. تأكد من تفعيل خدمة الموقع في إعدادات الهاتف.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'استغرقت استجابة الـ GPS وقتاً طويلاً. تأكد من اتصالك بالإنترنت (بيانات أو واي فاي) ثم حاول مجدداً.';
        }
        const customErr: any = new Error(msg);
        customErr.code = error.code;
        reject(customErr);
      },
      options
    );
  });
}

/**
 * Extracts Latitude and Longitude from various Google Maps URLs or direct coordinate strings
 */
export function parseCoordinatesFromInput(input: string): { lat: number; lng: number } | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. Check for @lat,lng format in Google Maps URLs
  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 2. Check for query parameter q=lat,lng or query=lat,lng
  const queryMatch = trimmed.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C|\+)(-?\d+\.\d+)/i);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 3. Check for !3dlat!4dlng
  const dataMatch = trimmed.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 4. Check for plain decimal coordinates: "15.3694, 44.1910"
  const plainMatch = trimmed.match(/(-?\d+\.\d{3,})(?:[,\s]+)(-?\d+\.\d{3,})/);
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1]);
    const lng = parseFloat(plainMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
