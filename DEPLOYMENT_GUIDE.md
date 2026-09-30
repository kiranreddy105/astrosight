# AstroSight Deployment & Cross-Device Guide

This guide explains how to:
1. **Open AstroSight on another laptop across the local network (Wi-Fi)** without installing anything extra.
2. **Transfer and run AstroSight on a new laptop (Windows, Mac, or Linux)**.
3. **Publish AstroSight online for free (Render, Railway, or Hugging Face)** so anyone worldwide can use it.
4. **Deploy using Docker** with a single command.

---

## Method 1: Open on Another Laptop on the Same Wi-Fi (Instant LAN Access)

If both laptops are connected to the same Wi-Fi network:

1. **On your current laptop**:
   - Double-click `run_astrosight.bat` (or run `.\run_astrosight.ps1`).
   - Open PowerShell or Command Prompt and run:
     ```bash
     ipconfig
     ```
   - Look for **IPv4 Address** under your Wi-Fi adapter (e.g. `192.168.1.45`).

2. **On the other laptop (or phone / tablet)**:
   - Open any web browser (Chrome, Edge, Safari, Firefox).
   - Navigate to:
     ```
     http://<YOUR_LAPTOP_IP>:5173
     ```
     *(Example: `http://192.168.1.45:5173`)*
   - The full NASA AstroSight Mission Control dashboard will load and connect seamlessly!

> **Note**: If the connection times out, ensure Windows Defender Firewall allows private network traffic for Node/Python, or temporarily allow port 5173 and 8000.

---

## Method 2: Transfer and Run on Another Laptop

### Step 1: Copy Project Files
Copy the `m1` folder to a USB drive or upload it to GitHub / Google Drive.

**Do NOT copy the heavy `node_modules` folder** (it will be regenerated automatically):
- Required folders to copy: `backend/`, `frontend/`, `requirements.txt`, `run_astrosight.bat`, `run_astrosight.ps1`, `README.md`.

### Step 2: Install Prerequisites on the New Laptop
Ensure the new laptop has:
1. **Python 3.10+** (from [python.org](https://www.python.org), ensure "Add Python to PATH" is checked during install).
2. **Node.js 18+** (from [nodejs.org](https://nodejs.org)).

### Step 3: Install Dependencies
Open a terminal in the project directory:

```bash
# 1. Install Python packages
pip install -r requirements.txt

# 2. Install Frontend packages
cd frontend
npm install
cd ..
```

### Step 4: Run
- On Windows: Double click `run_astrosight.bat`
- On Mac / Linux:
  ```bash
  # Terminal 1:
  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

  # Terminal 2:
  cd frontend
  npm run dev
  ```

---

## Method 3: Publish Online for Free (Cloud Hosting)

### Option A: Render.com (Recommended - Free Tier)

Render can build both the frontend and backend together as a single unified service:

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "AstroSight initial commit"
   git remote add origin https://github.com/your-username/astrosight.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and create a free account.
   - Click **New +** &rarr; **Web Service**.
   - Connect your GitHub repository.
   - Set the settings:
     - **Name**: `astrosight`
     - **Environment**: `Python 3`
     - **Build Command**:
       ```bash
       pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && python -m backend.samples.generate_samples
       ```
     - **Start Command**:
       ```bash
       uvicorn backend.main:app --host 0.0.0.0 --port $PORT
       ```
   - Click **Create Web Service**.
   - Render will build the React app and deploy the FastAPI backend. You will get a live URL: `https://astrosight.onrender.com`.

---

### Option B: Hugging Face Spaces (Ideal for ML / Computer Vision)

1. Create a free account on [huggingface.co](https://huggingface.co).
2. Click **New Space** &rarr; Select **Docker** as the SDK &rarr; Blank.
3. Push your repository to the Hugging Face Space repository.
4. Hugging Face will automatically use the included `Dockerfile` and launch the application!

---

### Option C: Split Hosting (Vercel Frontend + Render Backend)

- **Frontend on Vercel**: Connect your GitHub repo to [vercel.com](https://vercel.com). Root directory: `frontend`. Build command: `npm run build`. Output directory: `dist`.
- **Backend on Render / Railway**: Deploy the `backend/` folder on Render or Railway.
- In `frontend/vite.config.ts`, point the API proxy target to your live backend URL.

---

## Method 4: 1-Click Deployment with Docker

If Docker is installed on the destination machine:

```bash
# Build and run the entire platform
docker compose up -d --build
```

Then open `http://localhost:8000` in any web browser! Both the backend API and frontend dashboard will be running inside a single container.
