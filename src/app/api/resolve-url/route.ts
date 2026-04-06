import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    // Validate it's a Google Maps URL (accept various formats)
    const isGoogleMapsUrl = url && (
      url.includes('google.com/maps') ||
      url.includes('maps.google.com') ||
      url.includes('maps.app.goo.gl') ||
      url.includes('goo.gl/maps')
    );
    
    if (!isGoogleMapsUrl) {
      return NextResponse.json({ error: 'Invalid Google Maps URL' }, { status: 400 });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Next.js fetch follows redirects by default
    });

    const finalUrl = response.url;
    const html = await response.text();

    let lat = null;
    let lng = null;
    let title = 'Shared Location';

    // Extract title from OG tags
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || 
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      // Remove arbitrary endings like " - Google Maps"
      title = titleMatch[1].replace(/\s*[-·]\s*Google Maps/i, '').trim();
    }

    // Attempt 1: Parse from the final URL (Google Maps puts coordinates in the URL after redirect)
    // Matches something like @37.7749,-122.4194,15z or /place/name/@37.7749,-122.4194
    const atMatch = finalUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      lat = atMatch[1];
      lng = atMatch[2];
    }

    // Attempt 2: Look for coordinates in URL path like /maps/place/name/37.7749,-122.4194
    if (!lat || !lng) {
      const pathCoords = finalUrl.match(/\/(-?\d+\.?\d*),(-?\d+\.?\d*)(?:\/|$|\?)/);
      if (pathCoords) {
        lat = pathCoords[1];
        lng = pathCoords[2];
      }
    }

    // Attempt 3: Parse from og:image meta tag
    if (!lat || !lng) {
      const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
      if (imageMatch && imageMatch[1]) {
        // Decode the URL first
        const decodedImage = decodeURIComponent(imageMatch[1]);
        
        // Find center=37.7749,122.4194 or center=37.7749%2C-122.4194
        const centerMatch = decodedImage.match(/center=(-?\d+\.?\d*),(-?\d+\.?\d*)/) ||
                            imageMatch[1].match(/center=(-?\d+\.?\d+)%2C(-?\d+\.?\d+)/);
        if (centerMatch) {
          lat = centerMatch[1];
          lng = centerMatch[2];
        } else {
          // Also try markers parameter in staticmap url
          const markerMatch = decodedImage.match(/markers=.*?(-?\d+\.?\d*),(-?\d+\.?\d*)/) ||
                              imageMatch[1].match(/markers=([^%&]+)%7C(-?\d+\.?\d+)%2C(-?\d+\.?\d+)/);
          if (markerMatch && markerMatch.length >= 3) {
            lat = markerMatch[markerMatch.length - 2];
            lng = markerMatch[markerMatch.length - 1];
          }
        }
      }
    }
    
    // Attempt 4: Look for coordinates in HTML content (JavaScript data, etc.)
    if (!lat || !lng) {
      // Look for patterns like [lat, lng] or "lat":value,"lng":value in the HTML
      const coordPattern = html.match(/\[(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\]/);
      if (coordPattern) {
        // Validate these look like valid coordinates (lat: -90 to 90, lng: -180 to 180)
        const testLat = parseFloat(coordPattern[1]);
        const testLng = parseFloat(coordPattern[2]);
        if (testLat >= -90 && testLat <= 90 && testLng >= -180 && testLng <= 180) {
          lat = coordPattern[1];
          lng = coordPattern[2];
        }
      }
    }
    
    // Attempt 5: Look for ll=lat,lng in URL query params
    if (!lat || !lng) {
      try {
        const parsedUrl = new URL(finalUrl);
        const ll = parsedUrl.searchParams.get('ll');
        if (ll) {
          const parts = ll.split(',');
          if (parts.length === 2) {
            lat = parts[0].trim();
            lng = parts[1].trim();
          }
        } else {
          const query = parsedUrl.searchParams.get('q');
          if (query && query.includes(',')) {
            const parts = query.split(',').map(p => p.trim());
            // Check if query is coordinates
            if (parts.length >= 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
              lat = parts[0];
              lng = parts[1];
            }
          }
        }
      } catch (e) {
        console.error('URL parsing error:', e);
      }
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Could not extract coordinates', finalUrl, title }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      lat,
      lng,
      title
    });
  } catch (error: any) {
    console.error('URL Resolution Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
