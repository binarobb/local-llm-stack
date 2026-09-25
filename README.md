# Local LLM on Laptop (Docker + k3s + Ollama + Open WebUI)

This repository provides a **fully reproducible local LLM stack** running entirely on a laptop using:

- **Docker** – container runtime
- **k3s (via k3d)** – lightweight Kubernetes
- **Ollama** – local LLM inference engine
- **Open WebUI** – ChatGPT-style web interface
- **Ansible** – automation, idempotency, CI safety

The result is a **local, offline-capable LLM platform** with a Kubernetes-hosted UI and a Docker-hosted inference backend.

---

## Architecture

```
┌──────────────────────────────┐
│          Laptop Host         │
│                              │
│  ┌──────── Docker ────────┐ │
│  │                        │ │
│  │  ┌───────────────┐    │ │
│  │  │ Ollama        │◄───┐│ │
│  │  │ (LLM Engine)  │    ││ │
│  │  └───────────────┘    ││ │
│  │          ▲            ││ │
│  │          │ Docker net ││ │
│  │  ┌───────────────┐   ││ │
│  │  │ k3d / k3s     │───┘│ │
│  │  │ Kubernetes    │     │ │
│  │  │               │     │ │
│  │  │ Open WebUI    │     │ │
│  │  └───────────────┘     │ │
│  └────────────────────────┘ │
└──────────────────────────────┘
```

---

## Prerequisites

- Linux laptop (Ubuntu/Debian tested)
- Docker Engine
- Python 3
- Ansible
- kubectl

Optional (GPU):
- NVIDIA drivers
- NVIDIA Container Toolkit

Verify tools:

```bash
docker --version
kubectl version --client
ansible --version
```

---

## Repository Layout

```
ansible/
├── inventory/
│   └── local.ini
├── roles/
│   ├── ollama/
│   │   ├── defaults/main.yml
│   │   └── tasks/main.yml
│   └── open_webui/
│       └── tasks/main.yml
├── site.yml
└── ansible.cfg
```

---

## Create the Kubernetes Cluster

```bash
k3d cluster create dev   --agents 1   --network k3d-dev
```

Verify:

```bash
kubectl cluster-info
docker network ls | grep k3d-dev
```

---

## Inventory (CI-safe)

```ini
[local]
localhost ansible_connection=local ansible_become=true
```

---

## Running the Stack

Normal run:

```bash
ansible-playbook -i inventory/local.ini site.yml
```

Dry run / validation:

```bash
ansible-playbook -i inventory/local.ini site.yml --check --diff
```

---

## Verification

```bash
docker ps --format 'table {{.Names}}	{{.Status}}	{{.Networks}}'
kubectl get pods -A
```

---

## What You Get

- Fully local LLM (no cloud dependency)
- Persistent model storage
- Kubernetes-native UI
- GPU-ready
- CI-safe, idempotent Ansible automation
- Reproducible from scratch

---

## Status

✅ Docker fully Ansible-managed  
✅ Ollama healthchecks + model lifecycle  
✅ Open WebUI deployed on k3s  
⚠️ Kubernetes manifests currently static (next step: Ansible-native `kubernetes.core.k8s`)

---

## Next Steps

- Convert Kubernetes manifests to Ansible-managed resources
- Add Ingress + TLS
- Add CI pipeline (check-mode gate)
- Add backup/restore for Ollama models

---

This README is intended to be the **single source of truth** for reproducing the entire local LLM stack.


# Open WebUI on k3d

Self-hosted Open WebUI running on Kubernetes (k3d/k3s) behind Traefik with:

- HTTPS/TLS
- Basic Authentication
- Open WebUI authentication
- Ollama integration
- Persistent storage
- Ansible-managed deployment
- Ansible Vault for secrets

---

# Architecture

```text
Browser
   |
   | HTTPS
   |
https://webui.local:8443
   |
   v
Traefik
   |
   +-- UI Ingress (/)
   |      |
   |      +-- Basic Auth
   |
   +-- API Ingress
          |
          +-- /api
          +-- /ws
          +-- /ollama
                  |
                  v
             Open WebUI
                  |
                  v
                Ollama
```

---

# URLs

## Open WebUI

https://webui.local:8443

Requires:

1. Traefik Basic Auth
2. Open WebUI User Login

---

# Kubernetes Resources

Namespace:

```bash
open-webui
```

Resources:

```bash
kubectl get all -n open-webui
```

Ingresses:

```bash
kubectl get ingress -n open-webui
```

Expected:

```text
open-webui
open-webui-api
open-webui-http
```

---

# Deployment

Apply all resources:

```bash
ansible-playbook site.yml --tags k8s
```

Apply with vault password prompt:

```bash
ansible-playbook site.yml --tags k8s --ask-vault-pass
```

---

# Persistence

Open WebUI database location:

```text
/app/backend/data/webui.db
```

PVC:

```bash
kubectl get pvc -n open-webui
```

Expected:

```text
open-webui-data   Bound
```

Mounted to:

```text
/app/backend/data
```

Verify:

```bash
kubectl exec -it -n open-webui deployment/open-webui -- sh
```

```sh
mount | grep /app/backend/data
```

---

# Open WebUI

Check pod:

```bash
kubectl get pods -n open-webui
```

Logs:

```bash
kubectl logs -n open-webui deployment/open-webui
```

Restart:

```bash
kubectl rollout restart deployment/open-webui -n open-webui
```

Wait for rollout:

```bash
kubectl rollout status deployment/open-webui -n open-webui
```

---

# Ollama

Version:

```bash
curl http://127.0.0.1:11434/api/version
```

Models:

```bash
curl http://127.0.0.1:11434/api/tags
```

CLI:

```bash
ollama list
```

---

# TLS

Certificate secret:

```bash
open-webui-tls
```

Verify:

```bash
curl -k -I https://webui.local:8443
```

---

# Basic Authentication

Kubernetes Secret:

```bash
open-webui-basic-auth
```

Verify content:

```bash
kubectl get secret open-webui-basic-auth \
  -n open-webui \
  -o jsonpath='{.data.users}' | base64 -d
```

---

# API Routing

UI traffic:

```text
/
```

Protected by Basic Auth.

API traffic:

```text
/api
/ws
/ollama
```

Not protected by Basic Auth.

Verification:

```bash
curl -k -i https://webui.local:8443/api/v1/models
```

Expected:

```json
{"detail":"Not authenticated"}
```

NOT:

```text
WWW-Authenticate: Basic realm="Open WebUI"
```

---

# Ansible Vault

Edit vault:

```bash
ansible-vault edit group_vars/local/vault.yml
```

Run with vault password:

```bash
ansible-playbook site.yml --tags k8s --ask-vault-pass
```

---

# Health Checks

Open WebUI:

```bash
kubectl get pods -n open-webui
```

Ingress:

```bash
kubectl get ingress -n open-webui
```

PVC:

```bash
kubectl get pvc -n open-webui
```

Ollama:

```bash
curl http://127.0.0.1:11434/api/version
```

Models:

```bash
curl http://127.0.0.1:11434/api/tags
```

---

# Troubleshooting

## 401 from /api

Bad:

```http
WWW-Authenticate: Basic
```

Cause:

API route being handled by UI ingress.

Fix:

Ensure `open-webui-api` ingress exists.

---

## Open WebUI asks for Create Admin Account

Check database:

```bash
kubectl exec -it -n open-webui deployment/open-webui -- sh
```

```sh
python3 - <<'PY'
import sqlite3
db=sqlite3.connect('/app/backend/data/webui.db')
print(db.execute("select count(*) from user").fetchone())
PY
```

---

## Bad Gateway

Check:

```bash
curl http://127.0.0.1:11434/api/version
```

and:

```bash
kubectl logs -n open-webui deployment/open-webui
```

---

# Recovery

Reapply everything:

```bash
ansible-playbook site.yml --tags k8s
`*`

Restart Open WebUI:

```bash*kubectl rollout restart deployment*open-webui -n open-webui
```

Veri*y:

```bash*kubectl rollout status deployment/*pen-webui -n open-webui
```

---

* Current Status

✅ HTTPS working  *✅ Basic Auth working  
✅ Open WebU* working  
✅ Ollama working  
✅ AP* ingress working  
✅ Persistent da*abase mounted  
✅ Ansible-managed *eployment  
✅ Vault-managed secret*
