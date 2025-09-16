# PDGA Rating Calculator

A static web application to calculate your PDGA rating manually or by importing data from the PDGA website. All calculations are performed client-side in your browser, and your data is stored locally.

## Features

- ✅ **Fully Static**: No server required - runs entirely in your browser
- 📱 **Responsive Design**: Works perfectly on mobile devices
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📊 **PDGA Rating Calculation**: Accurate rating calculations based on PDGA algorithms
- 📝 **Manual Entry**: Add rounds manually with course, date, score, and rating
- 📥 **PDGA Import**: Import round data using your PDGA number
- 💾 **Local Storage**: Your data persists between sessions
- 🔄 **Multi-User Support**: Each user's data is isolated to their own browser

## Quick Start

### Option 1: Open Directly
Simply open `index.html` in your web browser - no installation required!

### Option 2: Local Server (Recommended)
For the best experience (especially for PDGA import functionality):

```bash
# Clone the repository
git clone https://github.com/rahulpuppala/pdga-rating-calculator.git
cd pdga-rating-calculator

# Start a local server (choose one):
# Option A: Python 3
python -m http.server 8000

# Option B: Python 2
python -m SimpleHTTPServer 8000

# Option C: Node.js (if you have it installed)
npx serve .
```

Then open your browser and navigate to `http://localhost:8000`

## Deployment

### Deploy to Netlify

1. **Fork/Clone** this repository to your GitHub account
2. **Connect to Netlify**:
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub account and select this repository
3. **Configure build settings**:
   - Build command: `echo "Static site - no build needed"`
   - Publish directory: `.` (root directory)
4. **Deploy**: Click "Deploy site"

### Deploy to GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select source: "Deploy from a branch"
4. Choose branch: `main` and folder: `/ (root)`
5. Your site will be available at `https://yourusername.github.io/pdga-rating-calculator`

## How It Works

### Rating Calculation
The app implements a simplified version of the PDGA rating algorithm:
- Uses all rounds with `included = 'Yes'` status
- For fewer than 8 rounds: calculates simple average (provisional rating)
- For 8+ rounds: uses top 25% of rounds (official rating)
- Rounds ratings to 2 decimal places

### Data Storage
- All data is stored in your browser's `localStorage`
- Data persists between sessions
- Each browser/device maintains separate data
- No data is sent to external servers (except for PDGA import)

### Multi-User Support
Yes! The app works for multiple users simultaneously:
- Each user's data is isolated to their own browser
- No shared state or conflicts between users
- Perfect for clubs or groups where multiple people use the same computer

## Usage

1. **Add Rounds Manually**:
   - Fill in the course name, date, tier, division, score, and round rating
   - Click "Add Round" to save it to your local data

2. **Import from PDGA**:
   - Enter your PDGA number in the import section
   - Click "Import Rounds" to fetch your tournament data
   - The app will automatically prevent duplicate entries

3. **View Your Rating**:
   - Your current rating is calculated automatically and displayed at the top
   - Shows whether it's an official rating (8+ rounds) or provisional
   - Displays total rounds, rounds used in calculation, and rounds needed for official rating

4. **Dark Mode**:
   - Click the moon/sun icon in the header to toggle between light and dark themes
   - Your preference is saved automatically

## Technical Details

### PDGA Import Functionality
The app fetches data directly from the PDGA website using CORS proxies. This approach:
- Works without requiring API keys or authentication
- Handles various date formats and tournament structures
- Automatically filters for evaluated rounds
- Respects PDGA's data structure and terms of service

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- Uses localStorage for data persistence

## Troubleshooting

### PDGA Import Issues
If PDGA import fails:
1. Check your internet connection
2. Verify the PDGA number is correct
3. Try again in a few minutes (rate limiting)
4. Use manual entry as an alternative

### Data Loss Prevention
- Data is automatically saved to localStorage
- Export your data by copying it from browser developer tools if needed
- Consider backing up important data manually

## License

MIT License - This project is for educational purposes. PDGA is a registered trademark of the Professional Disc Golf Association.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Make your changes
3. Test locally by opening `index.html` in a browser
4. Submit a pull request

### Reporting Issues
Please report bugs or feature requests through GitHub Issues.
