
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [title, setTitle] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate link');
        setLoading(false);
        return;
      }

      // Redirect to success page with the shareable URL
      router.push(`/success?url=${encodeURIComponent(data.shareableUrl)}&title=${encodeURIComponent(data.location.title)}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate coordinates
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Please enter valid numbers for latitude and longitude');
      return;
    }
    
    if (latNum < -90 || latNum > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    
    if (lngNum < -180 || lngNum > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }
    
    // Create shareable URL directly with coordinates
    const shareableUrl = `${window.location.origin}/go?lat=${lat}&lng=${lng}&title=${encodeURIComponent(title || 'Manual Location')}`;
    router.push(`/success?url=${encodeURIComponent(shareableUrl)}&title=${encodeURIComponent(title || 'Manual Location')}`);
  };

  const handleMapLocationSelect = async (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat.toFixed(6));
    setLng(selectedLng.toFixed(6));
    
    // Auto-fetch location name using reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${selectedLat}&lon=${selectedLng}&format=json&addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'MapsToAny-App/1.0',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const parts = [];
        
        // Build a human-readable location name
        if (address.amenity) parts.push(address.amenity);
        if (address.shop) parts.push(address.shop);
        if (address.tourism) parts.push(address.tourism);
        if (address.road) parts.push(address.road);
        if (address.neighbourhood) parts.push(address.neighbourhood);
        if (address.suburb) parts.push(address.suburb);
        if (address.city) parts.push(address.city);
        if (address.town) parts.push(address.town);
        if (address.village) parts.push(address.village);
        
        const locationName = parts.slice(0, 3).join(', ');
        if (locationName) {
          setTitle(locationName);
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      // Don't show error to user, just skip auto-naming
    }
  };

  const handleMapSubmit = () => {
    setError('');
    if (!lat || !lng) {
      setError('Please select a location on the map');
      return;
    }
    try {
      const shareableUrl = `${window.location.origin}/go?lat=${lat}&lng=${lng}&title=${encodeURIComponent(title || 'Selected Location')}`;
      router.push(`/success?url=${encodeURIComponent(shareableUrl)}&title=${encodeURIComponent(title || 'Selected Location')}`);
    } catch (err) {
      setError('Failed to navigate. Please try again.');
      console.error('Navigation error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <main className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            📍 Maps to Any
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Share Google Maps links that open in any navigation app
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Just like WhatsApp location sharing! 🚀
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          {!showManual && !showMap ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Google Maps URL
                </label>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !url}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Link...' : 'Generate Shareable Link'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowManual(true)}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-all text-sm"
                >
                  Enter coordinates
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="w-full bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 font-medium py-2 px-4 rounded-lg transition-all text-sm"
                >
                  📍 Pick on map
                </button>
              </div>
            </form>
          ) : showManual ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter coordinates manually as a fallback
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="lat"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="28.4196864"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lng" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="lng"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="77.1129344"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Name (optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Location"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowManual(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg transition-all"
                >
                  Back to URL
                </button>
                <button
                  type="submit"
                  disabled={!lat || !lng}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  Generate Link
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <MapPicker
                onLocationSelect={handleMapLocationSelect}
                initialLat={lat ? parseFloat(lat) : undefined}
                initialLng={lng ? parseFloat(lng) : undefined}
              />

              {lat && lng && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                    ✅ Location Selected:
                  </div>
                  <div className="text-xs font-mono text-blue-800 dark:text-blue-400">
                    Lat: {lat}, Lng: {lng}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="map-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Name <span className="text-gray-500 dark:text-gray-400 font-normal">(Auto-filled, edit if needed)</span>
                </label>
                <input
                  type="text"
                  id="map-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Will be auto-filled when you select a location..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMap(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg transition-all"
                >
                  Back to URL
                </button>
                <button
                  type="button"
                  onClick={handleMapSubmit}
                  disabled={!lat || !lng}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  Generate Link
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How it works
          </h2>
          <ol className="space-y-3 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0 mt-0.5">
                1
              </span>
              <span>Paste any Google Maps URL above</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0 mt-0.5">
                2
              </span>
              <span>Get a short, shareable link</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0 mt-0.5">
                3
              </span>
              <span>When clicked on mobile, it opens app chooser with Maps, Uber, Waze, etc.</span>
            </li>
          </ol>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Works on both iOS and Android
          </p>
        </div>
      </main>
    </div>
  );
}
