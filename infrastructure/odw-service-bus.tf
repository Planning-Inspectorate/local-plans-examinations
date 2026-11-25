data "azurerm_servicebus_namespace" "odw" {
  count               = var.odw_config == null ? 0 : 1
  name                = var.odw_config.service_bus_name
  resource_group_name = var.odw_config.resource_group_name
  provider            = azurerm.odw
}

data "azurerm_private_dns_zone" "servicebus" {
  name                = "privatelink.servicebus.windows.net"
  resource_group_name = var.tooling_config.network_rg
  provider            = azurerm.tooling

  tags = local.tags
}

data "azurerm_virtual_network" "odw" {
  count               = var.odw_config == null ? 0 : 1
  name                = var.odw_config.network_name
  resource_group_name = var.odw_config.network_resource_group_name

  provider = azurerm.odw
}


# peer to ODW VNET for integration
resource "azurerm_virtual_network_peering" "scheduling_to_odw" {
  count                     = var.odw_config == null ? 0 : 1
  name                      = "${local.org}-peer-${local.service_name}-to-odw-${var.environment}"
  remote_virtual_network_id = data.azurerm_virtual_network.odw[0].id
  resource_group_name       = azurerm_virtual_network.main.resource_group_name
  virtual_network_name      = azurerm_virtual_network.main.name
}

resource "azurerm_virtual_network_peering" "odw_to_scheduling" {
  count                     = var.odw_config == null ? 0 : 1
  name                      = "${local.org}-peer-odw-to-${local.service_name}-${var.environment}"
  remote_virtual_network_id = azurerm_virtual_network.main.id
  resource_group_name       = var.odw_config.network_resource_group_name
  virtual_network_name      = var.odw_config.network_name

  provider = azurerm.odw
}

# Role assignments
resource "azurerm_role_assignment" "back_office_staging_odw_service_bus_data_sender" {
  count                = var.odw_config == null ? 0 : 1
  scope                = data.azurerm_servicebus_namespace.odw[0].id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = module.app_manage.staging_principal_id
}

resource "azurerm_role_assignment" "back_office_odw_service_bus_data_sender" {
  count                = var.odw_config == null ? 0 : 1
  scope                = data.azurerm_servicebus_namespace.odw[0].id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = module.app_manage.principal_id
}

resource "azurerm_role_assignment" "front_office_staging_odw_service_bus_data_sender" {
  count                = var.odw_config == null ? 0 : 1
  scope                = data.azurerm_servicebus_namespace.odw[0].id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = module.app_portal.staging_principal_id
}

resource "azurerm_role_assignment" "front_office_odw_service_bus_data_sender" {
  count                = var.odw_config == null ? 0 : 1
  scope                = data.azurerm_servicebus_namespace.odw[0].id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = module.app_portal.principal_id
}