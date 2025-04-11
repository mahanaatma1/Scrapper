from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv(override=True)

EMAIL_ADDRESS = os.getenv("EMAIL_ID")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Request body model
class MailRequest(BaseModel):
    mail_id: EmailStr
    subject: str
    mail_body: str

@app.post("/send-mail")
def send_mail(request: MailRequest):
    try:
        msg = EmailMessage()
        msg['Subject'] = request.subject
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = request.mail_id
        msg.set_content(request.mail_body)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

        return {
            "status": 200,
            "message": f"Mail sent to {request.mail_id}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
