apps_config = {
  app_service_plan = {
    sku                      = "P0v3"
    per_site_scaling_enabled = false
    worker_count             = 1
    zone_balancing_enabled   = false
  }
  node_environment         = "development"
  private_endpoint_enabled = true

  auth = {
    client_id                = "69dfcc50-3e25-4289-abd8-599c7d576838"
    group_application_access = "79ea3092-b580-415a-82ad-f989fd20f49b"
  }

  entra = {
    group_ids = {
      # use app access group for now
      case_officers = "79ea3092-b580-415a-82ad-f989fd20f49b"
      inspectors    = "79ea3092-b580-415a-82ad-f989fd20f49b"
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
  application_id = "b2f22368-72f5-468e-ab2b-113bf5316452"
}

common_config = {
  resource_group_name = "pins-rg-common-dev-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-dev"
    its      = "pins-ag-odt-its-dev"
    info_sec = "pins-ag-odt-info-sec-dev"
  }
}

environment = "dev"

front_door_config = {
  name        = "pins-fd-common-tooling"
  rg          = "pins-rg-common-tooling"
  ep_name     = "pins-fde-local-plans"
  use_tooling = true
}

sql_config = {
  admin = {
    login_username = "pins-local-plans-sql-dev"
    object_id      = "fc16fc72-a28e-4fa9-b55d-aecedb64dbff"
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
  address_space                       = "10.34.0.0/22"
  apps_subnet_address_space           = "10.34.0.0/24"
  main_subnet_address_space           = "10.34.1.0/24"
  secondary_address_space             = "10.34.16.0/22"
  secondary_apps_subnet_address_space = "10.34.16.0/24"
  secondary_subnet_address_space      = "10.34.17.0/24"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}

web_domains = {
  manage = "local-plans-manage-dev.planninginspectorate.gov.uk"
  portal = "local-plans-portal-dev.planninginspectorate.gov.uk"
}
