targetScope = 'subscription'

@minLength(1)
@maxLength(64)
param environmentName string

@minLength(1)
param location string

param principalId string
param principalName string
param clientIpAddress string

@secure()
param sessionSecret string

var tags = {
  'azd-env-name': environmentName
  app: 'tetris'
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module tetris './modules/tetris-stack.bicep' = {
  name: 'tetris-stack'
  scope: resourceGroup
  params: {
    environmentName: environmentName
    location: location
    tags: tags
    principalId: principalId
    principalName: principalName
    clientIpAddress: clientIpAddress
    sessionSecret: sessionSecret
  }
}

output AZURE_RESOURCE_GROUP string = resourceGroup.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = tetris.outputs.containerRegistryEndpoint
output AZURE_KEY_VAULT_NAME string = tetris.outputs.keyVaultName
output KEY_VAULT_URL string = tetris.outputs.keyVaultUrl
output APPLICATIONINSIGHTS_CONNECTION_STRING string = tetris.outputs.appInsightsConnectionString
output SERVICE_WEB_NAME string = tetris.outputs.webName
output SERVICE_WEB_URI string = tetris.outputs.webUrl
output SQL_SERVER string = tetris.outputs.sqlServerFqdn
output SQL_DATABASE string = tetris.outputs.sqlDatabaseName
