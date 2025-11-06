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
    client_id                = "28d9e81f-cd87-4911-af2c-a2e2de7084f3"
    group_application_access = "a5948ef5-6b62-4dd2-978d-aef81a5ed7a7"
  }

  entra = {
    group_ids = {
      # use app access group for now
      case_officers = "a5948ef5-6b62-4dd2-978d-aef81a5ed7a7"
      inspectors    = "a5948ef5-6b62-4dd2-978d-aef81a5ed7a7"
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
  application_id = "22869cb0-3992-465d-bca0-49fe26ad6827"
}

common_config = {
  resource_group_name = "pins-rg-common-training-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-training"
    its      = "pins-ag-odt-its-training"
    info_sec = "pins-ag-odt-info-sec-training"
  }
}

environment = "training"

front_door_config = {
  name        = "pins-fd-common-tooling"
  rg          = "pins-rg-common-tooling"
  ep_name     = "pins-fde-local-plans"
  use_tooling = true
}

sql_config = {
  admin = {
    login_username = "pins-local-plans-sql-training"
    object_id      = "e2436d2f-4102-4bcb-ac04-bba335d6845f"
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
  address_space                       = "10.34.8.0/22"
  apps_subnet_address_space           = "10.34.8.0/24"
  main_subnet_address_space           = "10.34.9.0/24"
  secondary_address_space             = "10.34.24.0/22"
  secondary_apps_subnet_address_space = "10.34.24.0/24"
  secondary_subnet_address_space      = "10.34.25.0/24"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}

web_domains = {
  manage = "local-plans-manage-training.planninginspectorate.gov.uk"
  portal = "local-plans-portal-training.planninginspectorate.gov.uk"
}
