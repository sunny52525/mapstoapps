
'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/leafletFix';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

function LocationMarker({
  onLocationSelect,
  externalPosition
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  externalPosition: [number, number] | null;
}) {
  const [position, setPosition] = useState<[number, number] | null>(externalPosition);

  useEffect(() => {
    if (externalPosition) {
      setPosition(externalPosition);
    }
  }, [externalPosition]);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);

  return null;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchResultClick = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setSearchQuery('');
    setShowResults(false);
    onLocationSelect(lat, lng);
  };

  const handleCurrentLocation = () => {
    setLocationError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMarkerPosition([lat, lng]);
          setMapCenter([lat, lng]);
          onLocationSelect(lat, lng);
          setLocationError('');
        },
        (error) => {
          let errorMessage = 'Unable to get your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location permissions in your browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'The request to get your location timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }
          setLocationError(errorMessage);
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Please search for a location instead.');
    }
  };

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
      </div>
    );
  }

  const center: [number, number] = initialLat && initialLng 
    ? [initialLat, initialLng] 
    : [28.6139, 77.209]; // Default to Delhi, India

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {locationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {locationError}
        </div>
      )}

      {/* Search and Current Location Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search for a location (city, address, landmark...)"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all text-sm"
          />
          {isSearching && (
            <div className="absolute right-3 top-3 text-gray-400 text-sm">
              Searching...
            </div>
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[1000]">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="text-gray-900 dark:text-white font-medium">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                    {result.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all whitespace-nowrap text-sm flex items-center gap-2"
        >
          📍 Current Location
        </button>
      </div>

      {/* Map */}
      <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        {isClient && (
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              onLocationSelect={onLocationSelect}
              externalPosition={markerPosition}
            />
            <MapController center={mapCenter} />
          </MapContainer>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: Click anywhere on the map, search for a location, or use your current location
      </div>
    </div>
  );
}
