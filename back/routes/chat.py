from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import AsyncIterator
import json

from models.chat import ChatMessage, ChatResponse, JSONGenerationRequest
from services.llm_service import llm_service

router = APIRouter()


@router.post("/stream")
async def chat_stream(message: ChatMessage):
    """
    Chat endpoint with Server-Sent Events (SSE)
    
    Streams the LLM response in real-time using SSE format.
    
    Args:
        message: ChatMessage with user's message and optional context
        
    Returns:
        StreamingResponse with SSE events
    """
    
    async def generate() -> AsyncIterator[str]:
        """Generate SSE events from LLM stream"""
        try:
            async for chunk in llm_service.chat_stream(
                message.message, 
                message.context
            ):
                # Format as SSE event
                # SSE format: "data: {content}\n\n"
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            
            # Send done event
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            error_data = {
                "error": str(e),
                "type": type(e).__name__
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering
        }
    )


@router.post("/message", response_model=ChatResponse)
async def chat_message(message: ChatMessage):
    """
    Standard chat endpoint (non-streaming)
    
    Returns the complete LLM response at once.
    
    Args:
        message: ChatMessage with user's message and optional context
        
    Returns:
        ChatResponse with the complete response
    """
    try:
        response_chunks = []
        async for chunk in llm_service.chat_stream(
            message.message,
            message.context
        ):
            response_chunks.append(chunk)
        
        return ChatResponse(response="".join(response_chunks))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-json")
async def generate_json(request: JSONGenerationRequest):
    """
    Generate JSON from a prompt
    
    Uses LLM to generate structured JSON based on the prompt and context.
    
    Args:
        request: JSONGenerationRequest with prompt and optional context
        
    Returns:
        Generated JSON object
    """
    try:
        result = await llm_service.generate_json(
            request.prompt,
            request.context
        )
        return result
    
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to generate valid JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
