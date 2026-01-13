# AI-Powered Artisan Marketplace - Backend

## Overview
This is the FastAPI backend for the AI-Powered Artisan Marketplace. It is designed to be scalable, modular, and event-driven.

## Project Structure
- `app/api`: API route definitions
- `app/core`: Core application configuration, security, and utilities
- `app/db`: Database connection and models
- `app/ml`: AI/ML pipelines and model management
- `app/schemas`: Pydantic models for request/response validation
- `app/services`: Business logic and service layers
- `app/workers`: Background tasks (Celery/ARQ)

## Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Development
- **Docs**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc
