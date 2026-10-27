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
      case_officers = "0df70a68-7148-4c51-b20c-cf270df039c1"
      inspectors    = "829d3977-a25d-4c15-899f-c12420d77e15"
    }
  }

  functions_node_version = 24

  logging = {
    level = "info"
  }

  redis = {
    capacity = 0
    family   = "C"
    sku_name = "Basic"
  }
  managed_redis = {
    sku_name                  = "Balanced_B1"
    high_availability_enabled = true
    rdb_backup_frequency      = "1h"
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

documents_config = {
  account_replication_type = "GZRS"
}

environment = "prod"

front_door_config = {
  name        = "pins-fd-common-prod"
  rg          = "pins-rg-common-prod"
  ep_name     = "pins-fde-local-plans"
  use_tooling = false
}

gov_notify = {
  templates = {
    auth_id                       = "e57674eb-7830-4b71-9300-76fdac5ad13b"
    case_created                  = "9f258ed8-295d-421f-af9c-34d3e7f9cb1e"
    gw2_submission_id             = "aebb9331-0e0e-442c-ba51-f8adfd6cb90a"
    auth_id                       = "e57674eb-7830-4b71-9300-76fdac5ad13b"
    case_created                  = "09f1b5f7-4c2c-40c3-abee-505ffd86e629"
    gw2_submission_id             = "aebb9331-0e0e-442c-ba51-f8adfd6cb90a"
    gw2_assessor_updated_assessor = "0a1fc765-4304-4f4e-a22a-69a09ed5d92f"
    gw2_assessor_updated_lpa      = "c4251953-e29b-4435-a177-4c7129b488a7"
    gw2_workshop_inspector        = "a093a8f5-1871-424e-890f-71f9dada6926"
    gw2_workshop_lpa              = "a2221150-ac3c-4c29-8668-5e9a5d81bcec"
    gw2_workshop_agenda           = "9d584794-dc47-454b-8b95-ff05d06dbf0e"
    gw2_report_uploaded           = "3f7ce6a1-9cfc-445b-9e1d-b5f294d87380"
  }
}

monitoring_config = {
  app_insights_web_test_enabled        = true
  manage_app_insights_web_test_enabled = true
  log_daily_cap                        = 0.5
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

# Microsoft Clarity id for portal in this environment
clarity_id = ""
