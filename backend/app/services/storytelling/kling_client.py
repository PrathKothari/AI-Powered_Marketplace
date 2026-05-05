from __future__ import annotations

import logging
import uuid
import time
import base64
import jwt
from pathlib import Path
from typing import List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Normalize configured KLING API URL
raw = (settings.KLING_API_URL or "").rstrip("/")
KLING_API_URL = raw or "https://api-singapore.klingai.com"


def _generate_jwt_token(access_key: str, secret_key: str) -> str:
    """Generate JWT token for Kling API authentication per official docs.
    
    JWT consists of Header, Payload, and Signature using HS256.
    Token is valid for 30 minutes (1800 seconds).
    """
    headers = {
        "alg": "HS256",
        "typ": "JWT"
    }
    now = int(time.time())
    payload = {
        "iss": access_key,
        "exp": now + 1800,  # expires in 30 minutes
        "nbf": now - 5,      # valid 5 seconds ago
    }
    token = jwt.encode(payload, secret_key, algorithm="HS256", headers=headers)
    logger.debug("Generated JWT token for Kling (expires at %d)", payload["exp"])
    return token


def _guess_mimetype(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in (".png",):
        return "image/png"
    return "image/jpeg"


def generate_video_from_narration(narration: str, image_paths: List[str], voice: Optional[str] = None, **kwargs) -> str:
    """Generate video from narration and images using Kling API.
    
    Uses the multi-image2video endpoint per official Kling docs.
    Creates an async task and polls for completion.
    
    Args:
        narration: Text narration for the video
        image_paths: List of local image file paths
        voice: Voice ID (currently unused, voice is pre-generated)
    
    Returns:
        URL of generated video, or None if generation failed
    """
    if not image_paths:
        logger.warning("No images provided for Kling video generation")
        raise ValueError("At least one image is required")

    access = settings.KLING_ACCESS_KEY
    secret = settings.KLING_SECRET_KEY

    if not access or not secret:
        logger.error("Kling credentials not configured")
        raise ValueError("KLING_ACCESS_KEY and KLING_SECRET_KEY required")

    logger.info("Kling video generation started. Images: %d, Narration length: %d chars", len(image_paths), len(narration))

    # Generate JWT token for authorization per Kling API docs
    try:
        jwt_token = _generate_jwt_token(access, secret)
    except Exception as e:
        logger.error("Failed to generate JWT token: %s", e)
        raise ValueError(f"Failed to generate JWT token: {e}")
    
    headers = {"Authorization": f"Bearer {jwt_token}", "Content-Type": "application/json"}
    logger.debug("Request headers: Authorization=Bearer <JWT token>")

    # Use multi-image2video endpoint per official Kling docs
    endpoint = f"{KLING_API_URL}/v1/videos/multi-image2video"
    
    # Build request payload for multi-image2video
    image_list = []
    for img_path in image_paths:
        if not Path(img_path).exists():
            logger.warning("Image not found: %s", img_path)
            continue
        
        # Read image and convert to base64
        try:
            with open(img_path, "rb") as f:
                image_data = f.read()
            b64_image = base64.b64encode(image_data).decode("utf-8")
            image_list.append({"image": b64_image})
            logger.debug("Encoded image %s to base64 (%d bytes)", img_path, len(image_data))
        except Exception as e:
            logger.error("Failed to encode image %s: %s", img_path, e)
            continue
    
    if not image_list:
        logger.error("No valid images to send to Kling")
        raise ValueError("Could not encode any valid images")
    
    request_payload = {
        "model_name": "kling-v1-6",
        "image_list": image_list,
        "prompt": narration,
        "negative_prompt": "",
        "mode": "pro",
        "duration": "5",
        "aspect_ratio": "9:16",
        "callback_url": "",
        "external_task_id": str(uuid.uuid4())
    }
    
    logger.info("Attempting Kling endpoint: %s", endpoint)
    logger.debug("Request payload: model=%s, images=%d, duration=%s, aspect_ratio=%s", 
                 request_payload["model_name"], len(image_list), request_payload["duration"], request_payload["aspect_ratio"])

    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(endpoint, json=request_payload, headers=headers)
            logger.info("Kling response status: %d", resp.status_code)
            
            if resp.status_code >= 400:
                try:
                    error_body = resp.json()
                except:
                    error_body = resp.text
                logger.error("Kling API error %d: %s", resp.status_code, error_body)
                raise RuntimeError(f"Kling API error {resp.status_code}: {error_body}")
            
            # Parse response
            try:
                resp_json = resp.json()
                logger.debug("Kling response: code=%s, message=%s", resp_json.get("code"), resp_json.get("message"))
                
                if resp_json.get("code") != 0:
                    logger.error("Kling API returned error code %s: %s", resp_json.get("code"), resp_json.get("message"))
                    raise RuntimeError(f"Kling error: {resp_json.get('message')}")
                
                task_id = resp_json.get("data", {}).get("task_id")
                if not task_id:
                    logger.error("No task_id in Kling response: %s", resp_json)
                    raise RuntimeError("No task_id in Kling response")
                
                logger.info("Kling task created: task_id=%s, status=%s", task_id, resp_json.get("data", {}).get("task_status"))
                
                # Poll for task completion (max 5 minutes)
                video_url = _poll_kling_task(task_id, jwt_token, max_wait_seconds=300)
                if not video_url:
                    raise RuntimeError("Kling task polling failed or timed out")
                return video_url
                
            except (ValueError, KeyError) as e:
                logger.error("Failed to parse Kling response: %s, response: %s", e, resp.text[:200])
                raise RuntimeError(f"Failed to parse Kling response: {e}")

    except httpx.RequestError as e:
        logger.error("Kling request failed: %s", e)
        raise RuntimeError(f"Kling request failed: {e}")


def _poll_kling_task(task_id: str, jwt_token: str, max_wait_seconds: int = 300) -> Optional[str]:
    """Poll Kling task status until completion or timeout.
    
    Args:
        task_id: Kling task ID to poll
        jwt_token: JWT token for authentication
        max_wait_seconds: Maximum seconds to wait for task completion
    
    Returns:
        Video URL if task succeeds, None otherwise
    """
    headers = {"Authorization": f"Bearer {jwt_token}", "Content-Type": "application/json"}
    query_endpoint = f"{KLING_API_URL}/v1/videos/multi-image2video/{task_id}"
    
    start_time = time.time()
    poll_count = 0
    
    with httpx.Client(timeout=30.0) as client:
        while time.time() - start_time < max_wait_seconds:
            poll_count += 1
            try:
                resp = client.get(query_endpoint, headers=headers)
                
                if resp.status_code >= 400:
                    try:
                        error_body = resp.json()
                    except:
                        error_body = resp.text
                    logger.error("Kling query error %d: %s", resp.status_code, error_body)
                    return None
                
                resp_json = resp.json()
                task_status = resp_json.get("data", {}).get("task_status")
                logger.info("Kling task %s status: %s (poll #%d)", task_id, task_status, poll_count)
                
                if task_status == "succeed":
                    task_result = resp_json.get("data", {}).get("task_result", {})
                    videos = task_result.get("videos", [])
                    if videos and len(videos) > 0:
                        video_url = videos[0].get("url")
                        logger.info("Kling video generation succeeded: %s", video_url)
                        return video_url
                    else:
                        logger.error("No video URL in succeeded task result: %s", task_result)
                        return None
                
                elif task_status == "failed":
                    task_msg = resp_json.get("data", {}).get("task_status_msg", "Unknown error")
                    logger.error("Kling task failed: %s", task_msg)
                    return None
                
                elif task_status in ["submitted", "processing"]:
                    # Still processing, wait and retry
                    wait_time = min(5, max_wait_seconds - (time.time() - start_time))
                    if wait_time > 0:
                        logger.debug("Kling task still processing, waiting %d seconds...", int(wait_time))
                        time.sleep(wait_time)
                else:
                    logger.warning("Kling task unexpected status: %s", task_status)
                    return None
            
            except Exception as e:
                logger.error("Error polling Kling task: %s", e)
                return None
    
    logger.error("Kling task polling timeout after %d seconds (%d polls)", max_wait_seconds, poll_count)
    return None
