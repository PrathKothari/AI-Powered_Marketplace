import asyncio
import json
import logging
import os
import shutil
import subprocess
import tempfile
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from firebase_admin import firestore, storage
from pydantic import BaseModel

from app.core.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def get_db():
    return firestore.client()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    title: str
    description: str = ""
    productId: str


class SessionResponse(BaseModel):
    sessionId: str
    userId: str
    userName: str
    title: str
    description: str
    productId: str
    status: str
    viewerCount: int
    hlsUrl: Optional[str] = None
    recordingUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    startedAt: str
    endedAt: Optional[str] = None


# ── In-memory state for active streams ────────────────────────────────────────

class StreamManager:
    """Manages active live streams, HLS pipelines, and chat connections."""

    def __init__(self):
        # session_id -> stream metadata
        self.active_streams: Dict[str, Dict[str, Any]] = {}
        # session_id -> set of chat WebSocket connections
        self.chat_connections: Dict[str, List[WebSocket]] = {}
        # session_id -> FFmpeg subprocess
        self.ffmpeg_processes: Dict[str, subprocess.Popen] = {}
        # Base temp directory for HLS segments
        self.hls_base_dir = os.path.join(tempfile.gettempdir(), "kalasetu_hls")
        os.makedirs(self.hls_base_dir, exist_ok=True)

    def get_hls_dir(self, session_id: str) -> str:
        path = os.path.join(self.hls_base_dir, session_id)
        os.makedirs(path, exist_ok=True)
        return path

    def add_chat_connection(self, session_id: str, ws: WebSocket):
        if session_id not in self.chat_connections:
            self.chat_connections[session_id] = []
        self.chat_connections[session_id].append(ws)

    def remove_chat_connection(self, session_id: str, ws: WebSocket):
        if session_id in self.chat_connections:
            self.chat_connections[session_id] = [
                c for c in self.chat_connections[session_id] if c != ws
            ]

    def get_viewer_count(self, session_id: str) -> int:
        return len(self.chat_connections.get(session_id, []))

    async def broadcast_chat(self, session_id: str, message: dict):
        connections = self.chat_connections.get(session_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove_chat_connection(session_id, ws)

    def cleanup_session(self, session_id: str):
        # Kill FFmpeg if running
        proc = self.ffmpeg_processes.pop(session_id, None)
        if proc and proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        self.active_streams.pop(session_id, None)
        self.chat_connections.pop(session_id, None)


stream_manager = StreamManager()


# ── REST Endpoints ────────────────────────────────────────────────────────────

@router.post("/sessions", status_code=201)
async def create_session(
    request: CreateSessionRequest,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new live session. Returns sessionId and HLS URL."""
    db = get_db()

    # Verify the product exists and belongs to this user
    product_doc = db.collection("products").document(request.productId).get()
    if not product_doc.exists:
        raise HTTPException(status_code=404, detail="Product not found")
    product_data = product_doc.to_dict()
    if product_data.get("artisanId") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="You can only stream your own products")

    session_id = str(uuid.uuid4())
    hls_dir = stream_manager.get_hls_dir(session_id)

    session_data = {
        "sessionId": session_id,
        "userId": current_user["sub"],
        "userName": current_user.get("name", ""),
        "title": request.title,
        "description": request.description,
        "productId": request.productId,
        "status": "live",
        "viewerCount": 0,
        "hlsUrl": f"/hls/{session_id}/stream.m3u8",
        "recordingUrl": None,
        "thumbnailUrl": product_data.get("images", [None])[0],
        "startedAt": datetime.utcnow().isoformat(),
        "endedAt": None,
    }

    db.collection("live_sessions").document(session_id).set(session_data)
    stream_manager.active_streams[session_id] = session_data

    logger.info("Live session created: %s by user %s", session_id, current_user["sub"])
    return session_data


@router.get("/sessions")
async def list_sessions() -> List[Dict[str, Any]]:
    """List all live sessions (active first) and recent ended sessions.

    Auto-concludes any 'live' sessions that have no active streaming pipeline
    (e.g., backend restarted, or the streamer closed their tab without
    calling /end). Stale sessions are moved to the ended list.
    """
    db = get_db()
    now_iso = datetime.utcnow().isoformat()

    # Get sessions currently marked as "live" in Firestore
    live_query = db.collection("live_sessions").where("status", "==", "live").limit(20)
    all_live_docs = [doc.to_dict() for doc in live_query.stream()]

    truly_live: List[Dict[str, Any]] = []
    auto_ended: List[Dict[str, Any]] = []

    for session in all_live_docs:
        sid = session["sessionId"]
        is_active = (
            sid in stream_manager.ffmpeg_processes
            and stream_manager.ffmpeg_processes[sid].poll() is None
        )

        if is_active:
            session["viewerCount"] = stream_manager.get_viewer_count(sid)
            truly_live.append(session)
        else:
            # Stale session — mark it ended in Firestore and move to replays
            update_data = {
                "status": "ended",
                "endedAt": now_iso,
            }
            try:
                db.collection("live_sessions").document(sid).update(update_data)
            except Exception as e:
                logger.warning("Failed to auto-end stale session %s: %s", sid, e)
            session.update(update_data)
            session["viewerCount"] = 0
            auto_ended.append(session)

    truly_live.sort(key=lambda s: s.get("startedAt", ""), reverse=True)

    # Get previously ended sessions (replays)
    ended_query = db.collection("live_sessions").where("status", "==", "ended").limit(20)
    ended_sessions = [doc.to_dict() for doc in ended_query.stream()]
    # Merge in the ones we just auto-ended (they may not yet appear in the query result)
    seen_ids = {s["sessionId"] for s in ended_sessions}
    for s in auto_ended:
        if s["sessionId"] not in seen_ids:
            ended_sessions.append(s)

    ended_sessions.sort(key=lambda s: s.get("endedAt") or "", reverse=True)

    return truly_live + ended_sessions


@router.get("/sessions/{session_id}")
async def get_session(session_id: str) -> Dict[str, Any]:
    """Get details for a specific live session."""
    db = get_db()
    doc = db.collection("live_sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session = doc.to_dict()
    session["viewerCount"] = stream_manager.get_viewer_count(session_id)

    # Get recent chat messages (sort in Python to avoid composite index)
    chat_query = db.collection("live_chat_messages").where("sessionId", "==", session_id).limit(50)
    chat_messages = [doc.to_dict() for doc in chat_query.stream()]
    chat_messages.sort(key=lambda m: m.get("timestamp", ""))
    session["recentMessages"] = chat_messages

    return session


@router.patch("/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """End a live session. Triggers recording concatenation and upload."""
    db = get_db()
    doc = db.collection("live_sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session = doc.to_dict()
    if session["userId"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Only the streamer can end their session")
    if session["status"] == "ended":
        raise HTTPException(status_code=400, detail="Session already ended")

    # Stop FFmpeg and clean up stream state
    stream_manager.cleanup_session(session_id)

    # Try to concatenate HLS segments into a recording
    recording_url = None
    hls_dir = os.path.join(stream_manager.hls_base_dir, session_id)
    if os.path.exists(hls_dir):
        recording_url = await _create_recording(session_id, hls_dir)

    end_time = datetime.utcnow().isoformat()
    update_data = {
        "status": "ended",
        "endedAt": end_time,
    }
    if recording_url:
        update_data["recordingUrl"] = recording_url
        update_data["hlsUrl"] = recording_url

    db.collection("live_sessions").document(session_id).update(update_data)

    # Clean up temp HLS directory
    try:
        shutil.rmtree(hls_dir, ignore_errors=True)
    except Exception:
        pass

    logger.info("Live session ended: %s", session_id)
    session.update(update_data)
    return session


async def _create_recording(session_id: str, hls_dir: str) -> Optional[str]:
    """Concatenate HLS .ts segments into a single .mp4 and upload to Firebase Storage."""
    try:
        # Find all .ts segment files
        ts_files = sorted(
            [f for f in os.listdir(hls_dir) if f.endswith(".ts")],
            key=lambda x: os.path.getmtime(os.path.join(hls_dir, x)),
        )
        if not ts_files:
            logger.warning("No .ts segments found for session %s", session_id)
            return None

        # Create a concat list file for FFmpeg
        concat_file = os.path.join(hls_dir, "concat.txt")
        with open(concat_file, "w") as f:
            for ts in ts_files:
                f.write(f"file '{os.path.join(hls_dir, ts)}'\n")

        output_path = os.path.join(hls_dir, "recording.mp4")

        # Run FFmpeg to concatenate segments into MP4
        ffmpeg_args = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_file, "-c", "copy", output_path,
        ]
        process = await asyncio.create_subprocess_exec(
            *ffmpeg_args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()

        if process.returncode != 0:
            logger.error("FFmpeg concat failed: %s", stderr.decode())
            return None

        # Upload to Firebase Storage
        bucket = storage.bucket()
        blob_path = f"live_recordings/{session_id}/recording.mp4"
        blob = bucket.blob(blob_path)
        blob.upload_from_filename(output_path, content_type="video/mp4")
        blob.make_public()

        logger.info("Recording uploaded for session %s: %s", session_id, blob.public_url)
        return blob.public_url

    except Exception as e:
        logger.error("Failed to create recording for session %s: %s", session_id, e)
        return None


# ── WebSocket: Stream ingestion (MediaRecorder binary chunks) ─────────────────

@router.websocket("/ws/{session_id}/stream")
async def websocket_stream(websocket: WebSocket, session_id: str):
    """
    Receives binary webm chunks from the browser's MediaRecorder API
    and pipes them into FFmpeg for HLS transcoding.
    No WebRTC/aiortc needed — the browser encodes, we just relay to FFmpeg.
    """
    await websocket.accept()
    logger.info("Streamer WebSocket connected for session %s", session_id)

    hls_dir = stream_manager.get_hls_dir(session_id)
    m3u8_path = os.path.join(hls_dir, "stream.m3u8")

    # Start FFmpeg: reads webm from stdin, outputs HLS
    ffmpeg_args = [
        "ffmpeg", "-y",
        "-f", "webm",
        "-i", "pipe:0",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "zerolatency",
        "-c:a", "aac",
        "-b:a", "128k",
        "-f", "hls",
        "-hls_time", "2",
        "-hls_list_size", "3",
        "-hls_flags", "delete_segments+append_list",
        m3u8_path,
    ]

    ffmpeg_proc = subprocess.Popen(
        ffmpeg_args,
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    stream_manager.ffmpeg_processes[session_id] = ffmpeg_proc
    logger.info("FFmpeg HLS pipeline started for session %s", session_id)

    bytes_received = 0
    try:
        while True:
            data = await websocket.receive_bytes()
            bytes_received += len(data)

            if ffmpeg_proc.stdin and ffmpeg_proc.poll() is None:
                ffmpeg_proc.stdin.write(data)
                ffmpeg_proc.stdin.flush()
            else:
                # FFmpeg died — log stderr and break
                stderr_out = ffmpeg_proc.stderr.read() if ffmpeg_proc.stderr else b""
                logger.error("FFmpeg exited for session %s: %s", session_id, stderr_out.decode(errors="replace"))
                break

    except WebSocketDisconnect:
        logger.info("Streamer disconnected for session %s (received %d bytes)", session_id, bytes_received)
    except Exception as e:
        logger.error("Streamer WebSocket error for session %s: %s", session_id, e)
    finally:
        # Close FFmpeg stdin to finalize the last segment
        if ffmpeg_proc.stdin:
            try:
                ffmpeg_proc.stdin.close()
            except Exception:
                pass
        # Wait briefly for FFmpeg to finish writing
        try:
            ffmpeg_proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            ffmpeg_proc.kill()
        stream_manager.ffmpeg_processes.pop(session_id, None)
        logger.info("FFmpeg pipeline closed for session %s", session_id)

        # Auto-mark the session as ended in Firestore so it moves to replays
        # (handles the case where the streamer closes their tab without calling /end)
        try:
            db = get_db()
            doc_ref = db.collection("live_sessions").document(session_id)
            doc = doc_ref.get()
            if doc.exists and doc.to_dict().get("status") == "live":
                doc_ref.update({
                    "status": "ended",
                    "endedAt": datetime.utcnow().isoformat(),
                })
                logger.info("Auto-ended session %s after streamer disconnect", session_id)
        except Exception as e:
            logger.warning("Failed to auto-end session %s on disconnect: %s", session_id, e)


# ── WebSocket: Live Chat ──────────────────────────────────────────────────────

@router.websocket("/ws/{session_id}/chat")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """
    Real-time chat for a live session.
    Receives messages from any connected user, broadcasts to all,
    and persists to Firestore.
    """
    await websocket.accept()
    stream_manager.add_chat_connection(session_id, websocket)

    # Update viewer count in Firestore
    db = get_db()
    viewer_count = stream_manager.get_viewer_count(session_id)
    try:
        db.collection("live_sessions").document(session_id).update(
            {"viewerCount": viewer_count}
        )
    except Exception:
        pass

    logger.info(
        "Chat client connected for session %s (viewers: %d)", session_id, viewer_count
    )

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            chat_message = {
                "messageId": str(uuid.uuid4()),
                "sessionId": session_id,
                "userId": msg.get("userId", "anonymous"),
                "userName": msg.get("userName", "Anonymous"),
                "message": msg.get("message", ""),
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Persist to Firestore
            db.collection("live_chat_messages").document(chat_message["messageId"]).set(
                chat_message
            )

            # Broadcast to all connected clients
            await stream_manager.broadcast_chat(session_id, chat_message)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("Chat WebSocket error for session %s: %s", session_id, e)
    finally:
        stream_manager.remove_chat_connection(session_id, websocket)
        viewer_count = stream_manager.get_viewer_count(session_id)
        try:
            db.collection("live_sessions").document(session_id).update(
                {"viewerCount": viewer_count}
            )
        except Exception:
            pass
        logger.info(
            "Chat client disconnected for session %s (viewers: %d)",
            session_id,
            viewer_count,
        )
