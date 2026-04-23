import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import AuthenticatedUser, get_current_user
from core.database import ensure_meeting_record, get_meeting_record, get_or_create_user

router = APIRouter(
    prefix="/api/meetings",
    tags=["Meetings"]
)

class CreateMeetingResponse(BaseModel):
    room_id: str
    message: str

class CreateMeetingRequest(BaseModel):
    room_id: str | None = None
    host_id: str | None = None
    host_email: str | None = None
    host_name: str | None = None
    firebase_uid: str | None = None

class JoinMeetingRequest(BaseModel):
    room_id: str

@router.post("/create", response_model=CreateMeetingResponse)
async def create_meeting(
    payload: CreateMeetingRequest | None = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Creates a unique meeting ID that can be shared with other participants.
    """
    room_id = payload.room_id if payload and payload.room_id else str(uuid.uuid4())

    try:
        host_id = get_or_create_user(
            user_id=current_user.user_id,
            name=current_user.name,
            email=current_user.email,
            profile_picture=current_user.profile_picture,
        )
        ensure_meeting_record(meeting_id=room_id, host_user_id=host_id)
    except Exception as e:
        print(f"Error saving meeting record: {e}")

    return {
        "room_id": room_id,
        "message": "Meeting created successfully"
    }

@router.get("/{room_id}")
async def check_meeting(room_id: str):
    """
    Checks if a meeting ID exists in the database.
    """
    if not room_id:
        raise HTTPException(status_code=400, detail="Invalid room ID")

    try:
        meeting = get_meeting_record(room_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check meeting: {str(e)}")

    if meeting:
        return {
            "room_id": room_id,
            "valid": True,
            "host_id": meeting.get("host_id"),
            "host_email": meeting.get("host_email"),
            "host_name": meeting.get("host_name"),
        }
    return {"room_id": room_id, "valid": False}
