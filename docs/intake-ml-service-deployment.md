# Intake ML service deployment

The Node backend now sends palm counting, tablet identity, landmark motion, and
motion-video requests to a separate FastAPI service. It no longer needs Python
to serve these API requests.

## Render service 2

Create a Python Web Service from this repository (or copy `ml/`, the four
runtime files in `scripts/`, and `render.yaml` into a dedicated repository).

- Build: `pip install -r ml/requirements-render.txt`
- Start: `uvicorn ml.api:app --host 0.0.0.0 --port $PORT`
- Health check: `/health`

The required runtime scripts are:

- `scripts/analyze_palm_pills.py`
- `scripts/analyze_tablet_identity.py`
- `scripts/analyze_intake_motion_rules.py`
- `scripts/extract_mediapipe_motion_landmarks.py`

Keep the runtime model artifacts in `ml/models/`. Large datasets, training
reports, and training scripts are not needed by the deployed service.

After Render gives the service a URL, add this environment variable to the
existing Node backend and redeploy it:

```text
INTAKE_ML_SERVICE_URL=https://your-intake-ml-service.onrender.com
```

Do not replace the existing `ML_SERVICE_URL` or `EMOTION_ML_SERVICE_URL`; those
continue to point to the already deployed general/emotion ML service.
