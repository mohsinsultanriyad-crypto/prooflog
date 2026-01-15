const { getDistance } = require("geolib");

function metersBetween(aLat, aLng, bLat, bLng) {
  return getDistance(
    { latitude: aLat, longitude: aLng },
    { latitude: bLat, longitude: bLng }
  );
}

function isInsideFence(site, lat, lng) {
  const d = metersBetween(site.lat, site.lng, lat, lng);
  return { ok: d <= site.radiusMeters, distanceMeters: d };
}

module.exports = { metersBetween, isInsideFence };
