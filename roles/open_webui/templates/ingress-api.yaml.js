apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ open_webui_name }}-api
  namespace: {{ open_webui_namespace }}
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.priority: "100"
spec:
  ingressClassName: traefik
  rules:
    - host: {{ open_webui_host }}
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: {{ open_webui_name }}
                port:
                  number: 80

          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: {{ open_webui_name }}
                port:
                  number: 80

          - path: /ollama
            pathType: Prefix
            backend:
              service:
                name: {{ open_webui_name }}
                port:
                  number: 80
