targetScope = 'resourceGroup'

param environmentName string
param location string = resourceGroup().location
param tags object = {}
param principalId string
param principalName string
param clientIpAddress string

@secure()
param sessionSecret string

var suffix = take(uniqueString(subscription().subscriptionId, resourceGroup().name, environmentName, location), 6)
var safeEnvironmentName = empty(toLower(replace(environmentName, '-', ''))) ? 'tetris' : toLower(replace(environmentName, '-', ''))
var containerRegistryName = take(replace('cr${safeEnvironmentName}${suffix}', '-', ''), 50)
var keyVaultName = take(replace('kv${safeEnvironmentName}${suffix}', '-', ''), 24)
var logAnalyticsName = 'log-${environmentName}-${suffix}'
var appInsightsName = 'appi-${environmentName}-${suffix}'
var containerAppsEnvironmentName = 'cae-${environmentName}-${suffix}'
var containerAppName = 'ca-${environmentName}-${suffix}'
var sqlServerName = toLower('sql-${environmentName}-${suffix}')
var sqlDatabaseName = 'tetris'
var sqlServerFqdn = '${sqlServerName}${environment().suffixes.sqlServerHostname}'
var allowAzureServicesRuleName = 'AllowAzureServices'
var clientFirewallRuleName = 'AllowClientIp'

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    sku: {
      family: 'A'
      name: 'standard'
    }
    publicNetworkAccess: 'Enabled'
  }
}

resource sessionSecretResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'session-secret'
  properties: {
    value: sessionSecret
  }
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  tags: tags
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppsEnvironmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administrators: {
      administratorType: 'ActiveDirectory'
      principalType: 'User'
      login: principalName
      sid: principalId
      tenantId: subscription().tenantId
      azureADOnlyAuthentication: true
    }
    publicNetworkAccess: 'Enabled'
    minimalTlsVersion: '1.2'
    version: '12.0'
  }
}

resource sqlAllowAzureServicesRule 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: allowAzureServicesRuleName
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlClientFirewallRule 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = if (!empty(clientIpAddress)) {
  parent: sqlServer
  name: clientFirewallRuleName
  properties: {
    startIpAddress: clientIpAddress
    endIpAddress: clientIpAddress
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    autoPauseDelay: 60
    minCapacity: json('0.5')
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 34359738368
    zoneRedundant: false
  }
}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  tags: union(tags, {
    'azd-service-name': 'web'
  })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        allowInsecure: false
        targetPort: 3000
        transport: 'auto'
      }
      secrets: [
        {
          name: 'session-secret'
          value: sessionSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: 'mcr.microsoft.com/k8se/quickstart:latest'
          env: [
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsights.properties.ConnectionString
            }
            {
              name: 'HOST'
              value: '0.0.0.0'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'SESSION_SECRET'
              secretRef: 'session-secret'
            }
            {
              name: 'SQLSERVER_AUTH_MODE'
              value: 'default-azure-credential'
            }
            {
              name: 'SQLSERVER_DATABASE'
              value: sqlDatabaseName
            }
            {
              name: 'SQLSERVER_ENCRYPT'
              value: 'true'
            }
            {
              name: 'SQLSERVER_HOST'
              value: sqlServerFqdn
            }
            {
              name: 'SQLSERVER_PORT'
              value: '1433'
            }
            {
              name: 'SQLSERVER_TRUST_SERVER_CERTIFICATE'
              value: 'false'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

output appInsightsConnectionString string = appInsights.properties.ConnectionString
output containerRegistryEndpoint string = containerRegistry.properties.loginServer
output keyVaultName string = keyVault.name
output keyVaultUrl string = keyVault.properties.vaultUri
output sqlDatabaseName string = sqlDatabase.name
output sqlServerFqdn string = sqlServerFqdn
output webName string = containerApp.name
output webUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
