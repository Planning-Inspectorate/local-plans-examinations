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

/*
data "azurerm_virtual_network" "odw" {
  count               = var.odw_config == null ? 0 : 1
  name                = var.odw_config.network_name
  resource_group_name = var.odw_config.network_resource_group_name

  provider = azurerm.odw
}
resource "azurerm_private_dns_zone_virtual_network_link" "main_odw_servicebus" {
  name                = "${local.org}-vnetlink-servicebus-${local.service_name}-${var.environment}"
  private_dns_zone_id = data.azurerm_private_dns_zone.servicebus.id
  virtual_network_id  = azurerm_virtual_network.main.id
  provider            = azurerm.tooling
  tags                = local.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "secondary_odw_servicebus" {
  name                = "${local.org}-vnetlink-servicebus-${local.secondary_resource_suffix}-${var.environment}"
  private_dns_zone_id = data.azurerm_private_dns_zone.servicebus.id
  virtual_network_id  = azurerm_virtual_network.secondary.id
  provider            = azurerm.tooling
  tags                = local.tags
}

*/

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