services:
  - type: web
    name: typeform-backend
    runtime: python
    pythonVersion: 3.11
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn backend.main:app --host 0.0.0.0 --port 8000"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11