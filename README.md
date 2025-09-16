# PDGA Rating Calculator

A simple web application to calculate your PDGA rating manually or by importing data from the PDGA website.

## Features

- Add rounds manually with course, date, score, and rating
- Import round data using PDGA number (demo implementation)
- Calculate your estimated PDGA rating
- Responsive design that works on mobile devices

## Prerequisites

- Python 3.7+
- pip (Python package manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pdga-rating-calculator
   ```

2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Start the Flask development server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5001
   ```

3. Either:
   - Enter your PDGA number and click "Import" to fetch your round data (demo mode with sample data), or
   - Manually add rounds with course details and ratings

4. Click "Calculate Rating" to see your estimated PDGA rating

## Note About PDGA Data Import

The current implementation uses sample data for demonstration purposes. In a production environment, you would need to:

1. Use the official PDGA API (requires authentication)
2. Or implement web scraping (be aware of PDGA's terms of service)

## License

This project is for educational purposes only. PDGA is a registered trademark of the Professional Disc Golf Association.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
