import apiClient from './apiClient';

// API path variants for fallback requests
const VENDOR_PATHS = ['/vendors', '/vendor'];
const NODE_PATHS = ['/nodes', '/node'];
const CUSTOMER_PATHS = ['/customers', '/customer'];

// Helper function to try multiple API paths for requests
async function requestWithFallback(method, paths, payload) {
  let lastError;

  for (const path of paths) {
    try {
      const response = payload === undefined
        ? await apiClient[method](path)
        : await apiClient[method](path, payload);
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status != null && status !== 404) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Request failed.');
}

// Helper function to try multiple dynamically built paths
async function requestByPathWithFallback(method, buildPathVariants, payload) {
  let lastError;

  for (const path of buildPathVariants()) {
    try {
      const response = payload === undefined
        ? await apiClient[method](path)
        : await apiClient[method](path, payload);
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status != null && status !== 404) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Request failed.');
}

// CorrelationService class for vendor, node, and customer API operations
class CorrelationService {
  // Get all vendors
  static async getVendors() {
    return requestWithFallback('get', VENDOR_PATHS);
  }

  // Create a new vendor
  static async createVendor(vendor) {
    return requestWithFallback('post', VENDOR_PATHS, vendor);
  }

  // Update an existing vendor by ID
  static async updateVendor(id, vendor) {
    return requestByPathWithFallback('put', () => [
      `/vendors/${id}`,
      `/vendor/${id}`
    ], vendor);
  }

  // Delete a vendor by ID
  static async deleteVendor(id) {
    return requestByPathWithFallback('delete', () => [
      `/vendors/${id}`,
      `/vendor/${id}`
    ]);
  }

  // Get all nodes
  static async getNodes() {
    return requestWithFallback('get', NODE_PATHS);
  }

  // Assign a vendor to a node
  static async assignNodeVendor(nodeId, vendorId) {
    return requestByPathWithFallback('put', () => [
      `/nodes/${nodeId}/assign-vendor`,
      `/node/${nodeId}/assign-vendor`
    ], { vendorId });
  }

  // Assign a customer to a node
  static async assignNodeCustomer(nodeId, customerId) {
    return requestByPathWithFallback('put', () => [
      `/nodes/${nodeId}/assign-customer`,
      `/node/${nodeId}/assign-customer`
    ], { customerId });
  }

  // Get all customers
  static async getCustomers() {
    return requestWithFallback('get', CUSTOMER_PATHS);
  }
}

export default CorrelationService;
