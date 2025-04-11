from pydantic import BaseModel

class EmailRequest(BaseModel):
    title: str
    description: str
    dateOfPost: str
    persona: str
    link: str
    city: str
