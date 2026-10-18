# Pill and intake ML on Render without Docker

The hosted backend URL is the public API address. The pill and intake routes run
Python scripts inside the backend service. `PILL_ML_URL` is unused in this
codebase, so pointing it to the backend URL does not enable inference.

Render's native Python runtime also includes Node.js and npm. Use that runtime
for the existing `eldermeds-backend` web service, and install both dependency
sets in its build command. The trained detector is at
`ml/models/pill_detector.pt` in this repository; commit and push that file
along with `ml/requirements-render.txt`.

In Render's service settings:

1. Set **Runtime** to **Python 3**. Keep the repository root as the service root.
2. Set **Build Command** to:

   ```sh
   npm ci && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.5.1+cpu torchvision==0.20.1+cpu && pip install --no-cache-dir -r ml/requirements-render.txt
   ```

3. Set **Start Command** to `npm start`.
4. In **Environment**, keep the existing database, authentication, and other
   application variables. Add or update:

   ```dotenv
   PYTHON_VERSION=3.11.9
   INTAKE_DETECTOR_MODEL_PATH=ml/models/pill_detector.pt
   INTAKE_DETECTOR_CONFIDENCE=0.55
   YOLO_CONFIG_DIR=/tmp/ultralytics
   ```

   Remove `PILL_ML_PYTHON`, `INTAKE_VISION_PYTHON`, and any other Python command
   override with a Windows path. The routes will use the runtime's `python`
   command. Remove `PILL_ML_URL=http://localhost:5100` because this backend
   does not read it. Render does not read the local `.env` file.

5. Deploy the new commit. Check
   `https://eldermeds-backend.onrender.com/api/health`, then exercise an
   authenticated pill or intake endpoint. The health endpoint alone does not
   verify inference. If the build or inference runs out of memory, the service
   needs a larger Render instance or a separate ML service.

Optional tablet identity models must also be committed or supplied as deployment
artifacts if those features are required.
