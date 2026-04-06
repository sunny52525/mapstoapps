
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate it's a Google Maps URL (accept various formats)
    const isGoogleMapsUrl = url.includes('google.com/maps') || 
                           url.includes('maps.google.com') || 
                           url.includes('maps.app.goo.gl') ||
                           url.includes('goo.gl/maps');
    
    if (!isGoogleMapsUrl) {
      return NextResponse.json({ error: 'Please provide a valid Google Maps URL' }, { status: 400 });
    }

    // Call the existing resolve-url API to extract coordinates
    const resolveResponse = await fetch(`${req.headers.get('origin')}/api/resolve-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!resolveResponse.ok) {
      const errorData = await resolveResponse.json();
      return NextResponse.json({ 
        error: errorData.error || 'Failed to extract location from URL' 
      }, { status: 400 });
    }

    const { lat, lng, title } = await resolveResponse.json();

    // Build the shareable URL with query parameters (no storage needed!)
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const shareableUrl = `${origin}/go?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&title=${encodeURIComponent(title)}`;

    return NextResponse.json({
      success: true,
      shareableUrl,
      location: {
        lat,
        lng,
        title,
      },
    });
  } catch (error: any) {
    console.error('Generate Link Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate shareable link' 
    }, { status: 500 });
  }
}
