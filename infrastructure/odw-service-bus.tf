data "azurerm_servicebus_namespace" "odw" {
  count               = var.odw_config == null ? 0 : 1
  name                = var.odw_config.service_bus_name
  resource_group_name = var.odw_config.resource_group_name
  provider            = azurerm.odw
}

data "azurerm_virtual_network" "odw" {
  count               = var.odw_config == null ? 0 : 1
  name                = var.odw_config.network_name
  resource_group_name = var.odw_config.network_resource_group_name

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