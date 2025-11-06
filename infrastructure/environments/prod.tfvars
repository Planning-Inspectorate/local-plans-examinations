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
    client_id                = "651fb949-dfe5-4f20-b5dc-cbbde6d04951"
    group_application_access = "2442564b-4251-4c74-97fc-ad2f81575c8c"
  }

  entra = {
    group_ids = {
      # use app access group for now
      case_officers = "2442564b-4251-4c74-97fc-ad2f81575c8c"
      inspectors    = "2442564b-4251-4c74-97fc-ad2f81575c8c"
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
  auth_enabled   = false
  auth_client_id = "c991933d-41b2-4d4c-8220-1c9e1ffdbf92"
  application_id = "10081fec-80fb-4fcf-982b-6eab7482d801"
}

common_config = {
  resource_group_name = "pins-rg-common-prod-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-prod"
    its      = "pins-ag-odt-its-prod"
    info_sec = "pins-ag-odt-info-sec-prod"
  }
}

environment = "prod"

front_door_config = {
  name        = "pins-fd-common-prod"
  rg          = "pins-rg-common-prod"
  ep_name     = "pins-fde-local-plans"
  use_tooling = false
}

sql_config = {
  admin = {
    login_username = "pins-local-plans-sql-prod"
    object_id      = "1af901cb-de68-42db-a47d-cb798024709f"
  }
  sku_name    = "S3"
  max_size_gb = 100
  retention = {
    audit_days             = 7
    short_term_days        = 7
    long_term_weekly       = "P1W"
    long_term_monthly      = "P1M"
    long_term_yearly       = "P1Y"
    long_term_week_of_year = 1
  }
  public_network_access_enabled = false
}

vnet_config = {
  address_space                       = "10.34.12.0/22"
  apps_subnet_address_space           = "10.34.12.0/24"
  main_subnet_address_space           = "10.34.13.0/24"
  secondary_address_space             = "10.34.28.0/22"
  secondary_apps_subnet_address_space = "10.34.28.0/24"
  secondary_subnet_address_space      = "10.34.29.0/24"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}

web_domains = {
  manage = "<tbc>.planninginspectorate.gov.uk"
  portal = "<tbc>.planninginspectorate.gov.uk"
}
