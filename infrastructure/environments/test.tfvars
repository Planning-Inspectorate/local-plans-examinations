apps_config = {
  app_service_plan = {
    sku                      = "P0v3"
    per_site_scaling_enabled = false
    worker_count             = 1
    zone_balancing_enabled   = false
  }
  node_environment         = "production"
  private_endpoint_enabled = true

  auth = {
    client_id                = "79bfea80-79a7-4e1c-ae3f-27ae055f4395"
    group_application_access = "98fb2e7d-dc59-473d-9d0f-e728e5681784"
  }

  entra = {
    group_ids = {
      # use app access group for now
      case_officers = "98fb2e7d-dc59-473d-9d0f-e728e5681784"
      inspectors    = "98fb2e7d-dc59-473d-9d0f-e728e5681784"
    }
  }

  functions_node_version = 22

  logging = {
    level = "info"
  }

  redis = {
    capacity = 0
    family   = "C"
    sku_name = "Basic"
  }
}

auth_config_portal = {
  auth_enabled   = true
  auth_client_id = "c991933d-41b2-4d4c-8220-1c9e1ffdbf92"
  application_id = "9ccb6a39-b9a5-462f-b199-bc43622866c1"
}

common_config = {
  resource_group_name = "pins-rg-common-test-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-test"
    its      = "pins-ag-odt-its-test"
    info_sec = "pins-ag-odt-info-sec-test"
  }
}

environment = "test"

front_door_config = {
  name        = "pins-fd-common-tooling"
  rg          = "pins-rg-common-tooling"
  ep_name     = "pins-fde-local-plans"
  use_tooling = true
}

sql_config = {
  admin = {
    login_username = "pins-local-plans-sql-test"
    object_id      = "a1f6cb52-2af4-4586-9afd-281d0bda11f6"
  }
  sku_name    = "Basic"
  max_size_gb = 2
  retention = {
    audit_days             = 7
    short_term_days        = 7
    long_term_weekly       = "P1W"
    long_term_monthly      = "P1M"
    long_term_yearly       = "P1Y"
    long_term_week_of_year = 1
  }
}

vnet_config = {
  address_space                       = "10.34.4.0/22"
  apps_subnet_address_space           = "10.34.4.0/24"
  main_subnet_address_space           = "10.34.5.0/24"
  secondary_address_space             = "10.34.20.0/22"
  secondary_apps_subnet_address_space = "10.34.20.0/24"
  secondary_subnet_address_space      = "10.34.21.0/24"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}

web_domains = {
  manage = "local-plans-manage-test.planninginspectorate.gov.uk"
  portal = "local-plans-portal-test.planninginspectorate.gov.uk"
}
