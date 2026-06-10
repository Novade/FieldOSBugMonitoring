# Azure Deployment Plan

Status: Deployed - Pending Atlassian Callback Registration

## Goal
Deploy Field OS Bug Monitoring Dashboard to Azure Container Apps as a single container that serves both the React frontend and Express backend from one public URL.

## Current Architecture
- Frontend: React + Vite static build
- Backend: Node.js + Express API
- Auth: Atlassian OAuth 2.0
- Sessions: express-session in memory

## Target Architecture
- Azure Container Registry for container image storage
- Azure Container Apps Environment
- Azure Container App with external ingress
- One public HTTPS origin for frontend and backend

## Selected Azure Configuration
- Region: southeastasia
- Resource group: rg-fieldos-bug-dashboard
- Azure Container Registry: novadecontainerregistry
- Azure Container Registry resource group: rg-frc-prod-container-registry
- Container Apps environment: cae-fieldos-bug-dashboard
- Container App: ca-fieldos-bug-dashboard
- Container image: novadecontainerregistry.azurecr.io/fieldos-bug-dashboard:1
- Public ingress target port: 3001
- Replica range: min 1, max 1

## Deployment Steps
1. Prepare app for single-container production hosting.
2. Add Docker build files.
3. Build and verify locally.
4. Create Azure resource group, registry, Container Apps environment, and app.
5. Configure secrets and environment variables.
6. Configure Atlassian OAuth callback URL.
7. Verify deployed app and health endpoint.

## Required Inputs
- Azure subscription: confirm from active Azure CLI login
- Atlassian/Jira secret values: user will type into terminal prompts; do not print secrets

## Notes
- Keep max replicas at 1 until sessions are moved to a shared store such as Redis.
- Production frontend and backend will share the same Container App URL, avoiding CORS changes.
- App code changes required: serve frontend dist from Express in production, then add root Dockerfile and .dockerignore.
- Existing ACR will be reused; no new registry will be created.

## Deployment Result
- App URL: https://ca-fieldos-bug-dashboard.icyisland-594d23d6.southeastasia.azurecontainerapps.io
- Health URL: https://ca-fieldos-bug-dashboard.icyisland-594d23d6.southeastasia.azurecontainerapps.io/health
- Atlassian callback URL: https://ca-fieldos-bug-dashboard.icyisland-594d23d6.southeastasia.azurecontainerapps.io/auth/callback
- Verified health endpoint returned `{ "ok": true }`.
- Verified root URL returns the React frontend HTML.
