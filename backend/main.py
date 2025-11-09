from fastapi import FastAPI, HTTPException, Depends, Path, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, func, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from geoalchemy2 import Geometry
import json, os, jwt, bcrypt
from datetime import datetime, timedelta

# -----------------------------
# Database setup
# -----------------------------
DATABASE_URL = "postgresql://postgres:Shama2025@localhost:5432/darukaa_db"
SECRET_KEY = os.getenv("SECRET_KEY", "darukaasecretkey")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# -----------------------------
# Models
# -----------------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String, default="system")
    updated_by = Column(String, default="system")
    sites = relationship("Site", back_populates="project")

class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, nullable=False)
    polygon = Column(Geometry("POLYGON", srid=4326))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    project = relationship("Project", back_populates="sites")

Base.metadata.create_all(bind=engine)

# -----------------------------
# FastAPI Setup
# -----------------------------
app = FastAPI(title="Darukaa.Earth - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Helper Functions
# -----------------------------
def create_token(user_id: int):
    payload = {"user_id": user_id, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -----------------------------
# JWT Authentication Middleware
# -----------------------------
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = db.query(User).filter(User.id == payload["user_id"]).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# -----------------------------
# Schemas
# -----------------------------
class RegisterIn(BaseModel):
    name: str
    email: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

# -----------------------------
# Auth Routes
# -----------------------------
@app.post("/auth/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    pw_hash = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()
    user = User(name=payload.name, email=payload.email, password_hash=pw_hash)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return {
        "access_token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }

@app.post("/auth/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not bcrypt.checkpw(payload.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)
    return {
        "access_token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }

# -----------------------------
# User Management (Admin Only)
# -----------------------------
@app.get("/users")
def list_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]

@app.put("/users/{user_id}/role")
def update_user_role(user_id: int, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = data.get("role")
    if new_role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    target.role = new_role
    db.commit()
    db.refresh(target)
    return {"message": "Role updated", "user": {"id": target.id, "name": target.name, "email": target.email, "role": target.role}}

# -----------------------------
# Project Routes (Protected)
# -----------------------------
@app.post("/projects")
def create_project(project: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    new_project = Project(
        name=project["name"],
        description=project.get("description", ""),
        created_by=user.name,
        updated_by=user.name,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects")
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    result = []
    for p in projects:
        sites = db.query(Site).filter(Site.project_id == p.id).all()
        site_list = [{"id": s.id, "name": s.name} for s in sites]

        total_area = db.execute(
            text("SELECT SUM(ST_Area(ST_Transform(polygon, 3857)))/1000000 FROM sites WHERE project_id=:pid"),
            {"pid": p.id},
        ).scalar() or 0

        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "sites": site_list,
            "site_count": len(site_list),
            "total_area_sqkm": round(total_area, 2),
        })
    return result

@app.put("/projects/{project_id}")
def update_project(project_id: int, project: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = db.query(Project).filter(Project.id == project_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    existing.name = project.get("name", existing.name)
    existing.description = project.get("description", existing.description)
    existing.updated_by = user.name
    db.commit()
    db.refresh(existing)
    return existing

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"message": "Deleted successfully"}

# -----------------------------
# Sites Routes (Protected)
# -----------------------------
@app.post("/sites")
def create_site(item: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    polygon_wkt = item.get("polygon_wkt")
    if not polygon_wkt:
        raise HTTPException(status_code=400, detail="polygon_wkt required")
    s = Site(
        project_id=item.get("project_id"),
        name=item.get("name"),
        polygon=f"SRID=4326;{polygon_wkt}",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id, "name": s.name, "project_id": s.project_id}

@app.get("/sites")
def get_sites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.execute(
        text("""
            SELECT id, name, project_id,
                   ST_AsGeoJSON(polygon) AS geojson,
                   ST_Area(ST_Transform(polygon, 3857))/1000000 AS area_km2,
                   created_at, NOW() AS updated_at
            FROM sites
        """)
    ).fetchall()

    return [
        {
            "id": r[0],
            "name": r[1],
            "project_id": r[2],
            "geojson": json.loads(r[3]) if r[3] else None,
            "area_km2": round(r[4], 2) if r[4] else 0,
            "created_at": r[5].isoformat() if r[5] else None,
            "updated_at": r[6].isoformat() if r[6] else None,
        }
        for r in q
    ]

@app.put("/sites/{site_id}")
def update_site(site_id: int, item: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    if "name" in item:
        site.name = item["name"]
    if "polygon_wkt" in item and item["polygon_wkt"]:
        site.polygon = f"SRID=4326;{item['polygon_wkt']}"

    db.commit()
    db.refresh(site)
    return {"id": site.id, "name": site.name, "project_id": site.project_id}

@app.delete("/sites/{site_id}")
def delete_site(site_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(site)
    db.commit()
    return {"message": "Site deleted successfully"}

# -----------------------------
# Root
# -----------------------------
@app.get("/")
def root():
    return {"message": "Darukaa.Earth Backend is running ✅"}
