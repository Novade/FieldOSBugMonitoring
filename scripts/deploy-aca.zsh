#!/usr/bin/env zsh
set -euo pipefail

RESOURCE_GROUP="rg-fieldos-bug-dashboard"
LOCATION="southeastasia"
ACR_NAME="novadecontainerregistry"
ACR_RESOURCE_GROUP="rg-frc-prod-container-registry"
ACA_ENV="cae-fieldos-bug-dashboard"
APP_NAME="ca-fieldos-bug-dashboard"
IMAGE_NAME="fieldos-bug-dashboard:3"
JIRA_BASE_URL="https://novade.atlassian.net"

prompt_secret() {
  local name="$1"
  local value=""
  while [[ -z "$value" ]]; do
    print -n "$name: " > /dev/tty
    read -rs value < /dev/tty
    print "" > /dev/tty
  done
  print -r -- "$value"
}

prompt_value() {
  local name="$1"
  local value=""
  while [[ -z "$value" ]]; do
    print -n "$name: " > /dev/tty
    read -r value < /dev/tty
  done
  print -r -- "$value"
}

print "This script will deploy Field OS Bug Monitoring to Azure Container Apps."
print "Secrets typed here are not written to disk."
print ""

ATLASSIAN_CLIENT_ID="$(prompt_secret 'ATLASSIAN_CLIENT_ID')"
ATLASSIAN_CLIENT_SECRET="$(prompt_secret 'ATLASSIAN_CLIENT_SECRET')"
JIRA_CLOUD_ID="$(prompt_value 'JIRA_CLOUD_ID')"
JIRA_USER_EMAIL="$(prompt_value 'JIRA_USER_EMAIL')"
JIRA_API_TOKEN="$(prompt_secret 'JIRA_API_TOKEN')"

print -n "SESSION_SECRET (press Enter to generate one): " > /dev/tty
read -rs SESSION_SECRET < /dev/tty
print "" > /dev/tty
if [[ -z "$SESSION_SECRET" ]]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
fi

print ""
print "Ensuring Azure Container Apps extension is available..."
az extension add --name containerapp --upgrade --allow-preview true >/dev/null

print "Creating or reusing resource group: $RESOURCE_GROUP"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

if az acr show --name "$ACR_NAME" --resource-group "$ACR_RESOURCE_GROUP" >/dev/null 2>&1; then
  print "Reusing Azure Container Registry: $ACR_NAME in $ACR_RESOURCE_GROUP"
else
  print "ERROR: Expected existing Azure Container Registry '$ACR_NAME' in resource group '$ACR_RESOURCE_GROUP', but it was not found."
  exit 1
fi

print "Building image in Azure Container Registry..."
az acr build \
  --registry "$ACR_NAME" \
  --image "$IMAGE_NAME" \
  .

if az containerapp env show --name "$ACA_ENV" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  print "Reusing Container Apps environment: $ACA_ENV"
else
  print "Creating Container Apps environment: $ACA_ENV"
  az containerapp env create \
    --name "$ACA_ENV" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none
fi

ACR_PASSWORD="$(az acr credential show --name "$ACR_NAME" --resource-group "$ACR_RESOURCE_GROUP" --query 'passwords[0].value' --output tsv)"
IMAGE_FQDN="$ACR_NAME.azurecr.io/$IMAGE_NAME"
PLACEHOLDER_CALLBACK="https://placeholder.invalid/auth/callback"

if az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  print "Updating existing Container App: $APP_NAME"
  az containerapp update \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$IMAGE_FQDN" \
    --set-env-vars \
      NODE_ENV=production \
      PORT=3001 \
      FRONTEND_DIST_DIR=/app/public \
      JIRA_BASE_URL="$JIRA_BASE_URL" \
      JIRA_CLOUD_ID="$JIRA_CLOUD_ID" \
      JIRA_USER_EMAIL="$JIRA_USER_EMAIL" \
      ATLASSIAN_CALLBACK_URL="$PLACEHOLDER_CALLBACK" \
      ATLASSIAN_CLIENT_ID=secretref:atlassian-client-id \
      ATLASSIAN_CLIENT_SECRET=secretref:atlassian-client-secret \
      JIRA_API_TOKEN=secretref:jira-api-token \
      SESSION_SECRET=secretref:session-secret \
    --output none
else
  print "Creating Container App: $APP_NAME"
  az containerapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ACA_ENV" \
    --image "$IMAGE_FQDN" \
    --target-port 3001 \
    --ingress external \
    --registry-server "$ACR_NAME.azurecr.io" \
    --registry-username "$ACR_NAME" \
    --registry-password "$ACR_PASSWORD" \
    --min-replicas 1 \
    --max-replicas 1 \
    --secrets \
      atlassian-client-id="$ATLASSIAN_CLIENT_ID" \
      atlassian-client-secret="$ATLASSIAN_CLIENT_SECRET" \
      jira-api-token="$JIRA_API_TOKEN" \
      session-secret="$SESSION_SECRET" \
    --env-vars \
      NODE_ENV=production \
      PORT=3001 \
      FRONTEND_DIST_DIR=/app/public \
      JIRA_BASE_URL="$JIRA_BASE_URL" \
      JIRA_CLOUD_ID="$JIRA_CLOUD_ID" \
      JIRA_USER_EMAIL="$JIRA_USER_EMAIL" \
      ATLASSIAN_CALLBACK_URL="$PLACEHOLDER_CALLBACK" \
      ATLASSIAN_CLIENT_ID=secretref:atlassian-client-id \
      ATLASSIAN_CLIENT_SECRET=secretref:atlassian-client-secret \
      JIRA_API_TOKEN=secretref:jira-api-token \
      SESSION_SECRET=secretref:session-secret \
    --output none
fi

print "Updating Container App secrets..."
az containerapp secret set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --secrets \
    atlassian-client-id="$ATLASSIAN_CLIENT_ID" \
    atlassian-client-secret="$ATLASSIAN_CLIENT_SECRET" \
    jira-api-token="$JIRA_API_TOKEN" \
    session-secret="$SESSION_SECRET" \
  --output none

FQDN="$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn --output tsv)"
APP_URL="https://$FQDN"
CALLBACK_URL="$APP_URL/auth/callback"

print "Updating production URLs..."
az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --set-env-vars \
    ATLASSIAN_CALLBACK_URL="$CALLBACK_URL" \
    FRONTEND_URL="$APP_URL" \
  --output none

print "Restarting revision with final configuration..."
LATEST_REVISION="$(az containerapp revision list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query '[?properties.active].name | [-1]' --output tsv)"
if [[ -n "$LATEST_REVISION" ]]; then
  az containerapp revision restart \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --revision "$LATEST_REVISION" \
    --output none || true
fi

print ""
print "Deployment complete."
print "App URL: $APP_URL"
print "Health URL: $APP_URL/health"
print "Atlassian callback URL: $CALLBACK_URL"
print ""
print "Add the Atlassian callback URL above in the Atlassian developer console before testing login."
