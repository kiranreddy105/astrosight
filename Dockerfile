# --- Stage 1: Build Frontend ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Python Backend & Production Runtime ---
FROM python:3.11-slim
WORKDIR /app

# Install system libraries for OpenCV and scientific image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source and generated sample data
COPY backend/ ./backend/

# Copy built frontend production bundle from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Initialize samples and database
RUN python -m backend.samples.generate_samples

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
