# Testing Guide: QR Scanner Feature

## Quick Start

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open in browser**: `http://localhost:3000`

## Testing Methods

### Method 1: Dedicated Scanner Page (Recommended)

This is the cleanest workflow - players open `/scan` once and continuously scan cards.

1. Navigate to: `http://localhost:3000/scan`
2. Grant camera permissions when prompted
3. Point camera at a QR code
4. When scanned, it automatically navigates to the card page
5. On the card page, click "Scan Next Athlete" to scan again
   - OR click "Open Scanner Page" to return to `/scan`

**Expected behavior:**
- Camera opens automatically on `/scan` page
- QR code detection navigates to `/cards/[cardId]`
- No need to switch between apps

### Method 2: Scan from Card Page

1. Navigate to any card: `http://localhost:3000/cards/RR-BBK-001` (or any valid card ID)
2. Click "Scan Next Athlete" button
3. Grant camera permissions
4. Click "Start Camera" button
5. Point camera at QR code
6. When scanned, navigates to new card

**Expected behavior:**
- Scanner overlay appears
- After scan, navigates to new card
- Can repeat from any card page

## Testing Without Physical QR Codes

If you don't have printed QR codes yet, you can test by:

1. **Generate test QR codes**:
   - Visit: `http://localhost:3000/print/qr`
   - Print or display on another device/screen
   - Scan from your phone

2. **Use online QR generator**:
   - Go to any QR code generator
   - Create QR code with URL: `http://localhost:3000/cards/RR-BBK-001`
   - Scan it

3. **Test with phone camera**:
   - Open the scanner on your phone
   - Point at a QR code displayed on your computer screen

## Mobile Testing (Important!)

The scanner works best on mobile devices. To test:

1. **Find your local IP address**:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
   - Example: `192.168.1.100`

2. **Access from phone**:
   - Make sure phone is on same WiFi network
   - Open: `http://192.168.1.100:3000/scan` (replace with your IP)
   - Or use a service like `ngrok` for external access

3. **Test scanning**:
   - Grant camera permissions
   - Scan QR codes
   - Verify navigation works

## Troubleshooting

### Camera not starting
- **Check permissions**: Browser must have camera permission
- **HTTPS required**: Some browsers require HTTPS for camera access
  - Use `ngrok` or deploy to test HTTPS locally
  - Or use `localhost` (works on most browsers)

### "Failed to start camera" error
- Check if another app is using the camera
- Try refreshing the page
- Check browser console for detailed errors

### Scanner not detecting QR codes
- Ensure QR code contains URL in format: `/cards/[cardId]`
- Check QR code is clearly visible and well-lit
- Try moving closer/farther from QR code
- Ensure QR code is complete (not partially obscured)

### Navigation not working after scan
- Check browser console for errors
- Verify card ID exists in database
- Check network tab for failed requests

## Expected URLs

QR codes should contain URLs like:
- `http://localhost:3000/cards/RR-BBK-001`
- `https://rookie-run.vercel.app/cards/RR-MLB-001`

The scanner extracts the card ID (`RR-BBK-001`) and navigates to `/cards/[cardId]`.

## Database Requirements

Make sure your database has cards with IDs matching the QR codes. You can check:
- Visit: `http://localhost:3000/api/db-health`
- Or query the database directly

## Browser Compatibility

- ✅ Chrome/Edge (desktop & mobile)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (desktop & mobile)
- ⚠️ Some older browsers may not support camera API

## Next Steps

Once testing works:
1. Deploy to production (Vercel)
2. Update `BASE_URL` environment variable
3. Regenerate QR codes with production URLs
4. Print cards and test with physical QR codes
