from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import email_routes

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(email_routes.router, prefix="/api")
