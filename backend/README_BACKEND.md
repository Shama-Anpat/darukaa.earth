# Backend (FastAPI)

## Quickstart (local)
1. Create a PostgreSQL database `darukaa_db` and enable PostGIS:
   ```sql
   CREATE DATABASE darukaa_db;
   \c darukaa_db
   CREATE EXTENSION postgis;
   ```
2. Create and activate virtualenv:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Set env vars (optional) and run:
   ```bash
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/darukaa_db
   export SECRET_KEY="change_this"
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
4. API:
   - POST /auth/register  {name,email,password}
   - POST /auth/login     {email,password}
   - GET /projects
   - POST /projects       {name,description}
   - GET /sites
   - POST /sites          {project_id, name, polygon_wkt}
