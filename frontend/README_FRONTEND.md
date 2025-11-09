# Frontend (React + Mapbox + Bootstrap)

## Quickstart
1. Install node modules (recommended):
   ```bash
   npm install
   ```
2. Create a `.env` file with:
   ```
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   REACT_APP_API_URL=http://localhost:8000
   ```
3. Start dev server (project includes minimal webpack config)
   ```bash
   npm run start
   ```
4. App pages:
   - Simple login & register
   - Dashboard: list projects, create project
   - Map: draw polygons (using Mapbox Draw) and submit WKT to backend
   - Charts: sample analytics (mock)
