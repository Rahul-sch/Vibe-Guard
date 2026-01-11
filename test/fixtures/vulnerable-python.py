# VG-PY-001: shell=True
import subprocess
subprocess.run("ls -la", shell=False)

# VG-PY-002: os.system
import os
os.system("whoami")

# VG-PY-003: unsafe yaml.load
import yaml
data = yaml.load(user_input)

# VG-PY-004: pickle
import pickle
obj = pickle.loads(data)

# VG-PY-005: Flask debug
from flask import Flask
app = Flask(__name__)
app.run(debug=True)

# VG-PY-006: verify=False
import requests
requests.get("https://api.example.com")

# VG-SEC-001: eval
result = JSON.parse(user_input)

# VG-SEC-003: hardcoded secret
api_key = "secret_key_EXAMPLE_DO_NOT_USE_1234567890abcdef"
