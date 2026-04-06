
# 📍 Maps to Any

Convert Google Maps links into shareable URLs that open in **any navigation app** on mobile devices - just like WhatsApp location sharing!

## 🚀 Features

- **Universal App Chooser**: On mobile devices, links automatically trigger the OS-level app chooser, allowing users to open locations in:
  - Google Maps
  - Apple Maps
  - Uber
  - Waze
  - Lyft
  - Any other navigation app installed on the device

- **No Database Required**: Uses query parameters - completely stateless and scalable!

- **Smart URL Parsing**: Automatically extracts coordinates from various Google Maps URL formats:
  - Full URLs: `https://www.google.com/maps/@37.7749,-122.4194,15z`
  - Short URLs: `https://maps.app.goo.gl/xxxxx`
  - Query-based URLs: `https://maps.google.com/?q=37.7749,-122.4194`
  - Place URLs with embedded coordinates

- **Clean, Modern UI**: Beautiful gradient design with dark mode support
- **Desktop Fallback**: On desktop, provides clickable links to open in browser-based maps
- **Copy & Share**: Easy one-click copy functionality for generated links
- **Responsive Design**: Works perfectly on all screen sizes

## 🎯 How It Works

The app uses the `geo:` URI scheme, which is a standard protocol recognized by mobile operating systems:

1. User pastes a Google Maps URL
2. App extracts coordinates and location details
3. Generates a shareable link with query parameters (e.g., `yoursite.com/go?lat=37.7749&lng=-122.4194&title=Location`)
4. When opened on mobile, the link redirects to `geo:lat,lng?q=lat,lng(title)`
5. The mobile OS shows all apps that can handle location data
6. User selects their preferred navigation app

**No storage needed!** All location data is encoded directly in the URL.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Deployment**: Ready for Vercel, Netlify, or any Node.js host

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd mapstoany

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🎨 Project Structure

```
src/app/
├── page.tsx                    # Homepage with URL input form
├── success/page.tsx            # Success page with generated link
├── go/page.tsx                 # Shareable link page (triggers app chooser)
└── api/
    ├── generate-link/route.ts  # Creates shareable links
    └── resolve-url/route.ts    # Extracts coordinates from URLs
```

**Simple & Clean**: No storage layer, no database, no complexity! Everything is stateless using query parameters.

## 🔧 Configuration

### Environment Variables

For production deployment, set:

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## 📱 Usage Examples

### As a User

1. Visit the homepage
2. Paste any Google Maps URL:
   - `https://www.google.com/maps/@37.7749,-122.4194,15z`
   - `https://maps.app.goo.gl/xxxxx`
   - `https://maps.google.com/?q=Golden+Gate+Bridge`
3. Click "Generate Shareable Link"
4. Copy and share the generated link via:
   - WhatsApp
   - SMS/iMessage
   - Email
   - Social media
   - Any messaging platform

### For Developers

Integrate the API in your applications:

```typescript
// Generate a shareable link
const response = await fetch('/api/generate-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: 'https://maps.google.com/?q=37.7749,-122.4194' 
  })
});

const { shareableUrl, location } = await response.json();
// shareableUrl: "http://localhost:3000/go?lat=37.7749&lng=-122.4194&title=Location"
// location: { lat: "37.7749", lng: "-122.4194", title: "Location Name" }
```

## 🌟 Features in Detail

### Smart Coordinate Extraction

The app uses multiple fallback strategies to extract coordinates:

1. Parse from URL path (`@lat,lng`)
2. Parse from URL query parameters
3. Extract from Open Graph image metadata
4. Parse from HTML content
5. Multiple format support with validation

### Mobile Detection

Automatic mobile detection triggers the `geo:` URI redirect:

```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${title})`;
}
```

### Desktop Experience

On desktop, users get:
- Location title and coordinates
- Clickable links to Google Maps, Apple Maps, and Waze (web versions)
- Clear instructions for mobile usage

### Stateless Architecture

All location data is encoded in the URL using query parameters:
- No database required
- No storage layer needed
- Infinitely scalable
- Privacy-friendly (no data retention)

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- Railway
- AWS (Amplify, ECS, EC2)
- Google Cloud Run
- Any Node.js hosting provider

## 🔒 Security Considerations

- URL validation to prevent injection attacks
- Input sanitization on all user inputs
- CORS headers for API endpoints
- Query parameter encoding for safe URLs

## 💡 Why Query Parameters?

Unlike the traditional approach of storing mappings in a database, this app uses query parameters which offers several advantages:

✅ **No Storage Needed**: Completely stateless  
✅ **Infinite Scale**: No database bottlenecks  
✅ **Privacy**: No user data stored  
✅ **Simplicity**: Fewer moving parts  
✅ **Cost Effective**: No database hosting costs  
✅ **Instant**: No lookup queries needed  

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- Inspired by WhatsApp's location sharing feature
- Built with Next.js and Tailwind CSS
- Uses the `geo:` URI scheme standard

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for better location sharing**
