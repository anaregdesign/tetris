#!/bin/sh
set -eu

eval "$(azd env get-values)"

export AZURE_RESOURCE_GROUP
export AZURE_CONTAINER_REGISTRY_ENDPOINT
export SQL_SERVER
export SQL_DATABASE
export SERVICE_WEB_NAME

APP_PRINCIPAL_ID="$(az containerapp show --resource-group "$AZURE_RESOURCE_GROUP" --name "$SERVICE_WEB_NAME" --query identity.principalId -o tsv)"
ACR_NAME="${AZURE_CONTAINER_REGISTRY_ENDPOINT%%.*}"
ACR_ID="$(az acr show --resource-group "$AZURE_RESOURCE_GROUP" --name "$ACR_NAME" --query id -o tsv)"
ACR_PULL_ASSIGNMENT_COUNT="$(az role assignment list --assignee-object-id "$APP_PRINCIPAL_ID" --scope "$ACR_ID" --query "[?roleDefinitionName=='AcrPull'] | length(@)" -o tsv)"

if [ "$ACR_PULL_ASSIGNMENT_COUNT" = "0" ]; then
  az role assignment create \
    --assignee-object-id "$APP_PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --role AcrPull \
    --scope "$ACR_ID" \
    >/dev/null
fi

az containerapp registry set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$SERVICE_WEB_NAME" \
  --server "$AZURE_CONTAINER_REGISTRY_ENDPOINT" \
  --identity system \
  >/dev/null

npx tsx ./scripts/azure/postprovision.ts
