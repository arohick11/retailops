# HashiCorp Vault Configuration File
# Suitable for academic/demo RetailOps project evaluation.
#
# This configuration file defines the storage, listener, and general settings for Vault.

# 1. Storage Backend Configuration
# For demo/academic setups, we use the local 'file' storage backend.
# In production, this would be replaced with a highly-available backend like Consul, Raft, or AWS DynamoDB.
storage "file" {
  # Specifies the filesystem directory where Vault data will be written
  path = "/vault/data"
}

# 2. HTTP Listener Configuration
# Defines how Vault listens for incoming API/UI requests.
listener "tcp" {
  # Listen on all local interfaces on port 8200
  address     = "0.0.0.0:8200"
  
  # TLS is disabled here to simplify local academic/demo setup.
  # WARNING: In a production cluster, TLS must be enabled (tls_disable = "false") with valid certificates.
  tls_disable = "true"
}

# 3. Cluster / Advertise Settings
# Defines the API and cluster addresses advertised to other clients/nodes.
api_addr = "http://127.0.0.1:8200"
cluster_addr = "http://127.0.0.1:8201"

# 4. User Interface (UI) Configuration
# Enable the built-in Vault web UI console, which is useful for demonstration and grading.
ui = true

# 5. Disable mlock
# Prevents Vault from memory locking, which prevents sensitive data from being swapped to disk.
# It is disabled here because standard Kubernetes pods do not have IPC_LOCK privileges by default.
disable_mlock = true
