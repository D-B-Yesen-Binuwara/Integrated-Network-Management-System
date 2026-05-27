import apiClient from './apiClient';

const VENDOR_COLLECTION_PATHS = ['/vendors', '/vendor'];

async function requestCollection(method, payload) {
  let lastError;

  for (const path of VENDOR_COLLECTION_PATHS) {
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

  throw lastError ?? new Error('Vendor request failed.');
}

async function requestById(method, id, payload) {
  const paths = [`/vendors/${id}`, `/vendor/${id}`];
  let lastError;

  for (const path of paths) {
    try {
      const response = payload === undefined
        ? await apiClient[method](path)
        : await apiClient[method](path, payload);
      return response?.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status != null && status !== 404) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Vendor request failed.');
}

class VendorService {
  static async getAll() {
    return requestCollection('get');
  }

  static async create(vendorPayload) {
    return requestCollection('post', vendorPayload);
  }

  static async update(id, vendorPayload) {
    return requestById('put', id, vendorPayload);
  }

  static async delete(id) {
    return requestById('delete', id);
  }
}

export default VendorService;
