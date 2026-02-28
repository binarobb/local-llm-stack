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

