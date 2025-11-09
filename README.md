# darukaa.earth
geospatial data analytics platform.


Darukaa.Earth is a geospatial data analytics platform that helps organizations, researchers, and urban planners visualize, analyze, and monitor spatial data efficiently. The platform provides interactive maps, polygon-based area analysis, and insights to support smart city planning, environmental monitoring, and sustainable development.

**🚀 Features**

Interactive Maps: Render high-performance, zoomable maps with Mapbox GL JS.

Polygon Analytics: Draw and analyze polygons for environmental and urban areas.

Dynamic Data Visualization: Charts, graphs, and heatmaps for spatial insights.

Real-time Updates: Push notifications and live updates for geospatial changes.

User-Friendly UI: Modern, responsive interface with React.js.

CI/CD Enabled: Automatic deployment to Vercel/Heroku/Render for instant updates.

**🛠 Tech Stack
Layer	Technology**

Frontend :	React.js, TailwindCSS, Recharts, Mapbox GL JS

Backend: 	Node.js, Express.js

Database :	PostgreSQL + PostGIS

DevOps	: GitHub Actions, Vercel/Heroku/Render

Code Quality :	ESLint, Prettier, Husky, lint-staged

**📦 Installation
Prerequisites**

Node.js ≥ 20

PostgreSQL with PostGIS extension

Git

**Clone the repository**
git clone git@github.com:yourusername/darukaa.earth.git
cd darukaa.earth

**Install dependencies**
npm install

**Run locally**
npm start

**⚙️ CI/CD Pipeline**

Darukaa.Earth uses GitHub Actions for CI/CD:

Runs linting and tests on every push and pull request.

Builds the project automatically.

Deploys to Vercel/Heroku/Render for a publicly accessible URL.

**Code Quality**

Pre-commit hooks using Husky + lint-staged:

Auto-format with Prettier

Run ESLint before every commit

**📊 Usage**

Access the live application: Darukaa.Earth

Draw polygons to analyze specific geospatial areas.

Visualize data using interactive charts and graphs.

Export insights for reports or further analysis.
