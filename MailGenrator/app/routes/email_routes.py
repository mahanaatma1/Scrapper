from fastapi import APIRouter, HTTPException
from app.models.request_model import EmailRequest
from app.services.openai_service import generate_reply
from app.config.prompts import get_prompt_by_persona
from app.utils.cleaner import clean_input_json 

router = APIRouter()

@router.post("/generate/")
@router.post("/generate/")
async def generate_email(request: EmailRequest):
    prompt_config = get_prompt_by_persona(request.persona)

    if not prompt_config:
        raise HTTPException(status_code=404, detail="Persona not found")

    # ✅ Clean the incoming input JSON
    cleaned_request = clean_input_json(request.dict())

    # Now pass clean values into OpenAI service
    reply = generate_reply(
        prompt_config,
        cleaned_request['title'],
        cleaned_request['description'],
        cleaned_request['dateOfPost'],
        cleaned_request['link'],
        cleaned_request['city']
    )

    return {"reply": reply}
