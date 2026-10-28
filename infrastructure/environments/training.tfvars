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
    sku_name                  = "Balanced_B0"
    high_availability_enabled = false
    rdb_backup_frequency      = null
  }
}

auth_config_portal = {
  auth_enabled   = false
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

documents_config = {
  account_replication_type = "LRS"
}

environment = "training"

front_door_config = {
  name        = "pins-fd-common-tooling"
  rg          = "pins-rg-common-tooling"
  ep_name     = "pins-fde-local-plans"
  use_tooling = true
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
    gw3_assessor_updated_assessor = "27edd965-52be-4de6-b4b2-318d027faf4a"
    gw3_assessor_updated_lpa      = "f3c4fbb9-1e2f-48ec-ad2f-57e2fcdc73aa"
    gw3_passed                    = "e67dcb5a-d732-4426-b03f-a2f0de051b0f"
    gw3_resubmission_required     = "27883cad-a44d-454d-a009-3bb17c5ced2c"
  }
}

monitoring_config = {
  app_insights_web_test_enabled        = false
  manage_app_insights_web_test_enabled = false
  log_daily_cap                        = 0.1
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

# Microsoft Clarity id for portal in this environment
clarity_id = "xy5mqjzeku"
