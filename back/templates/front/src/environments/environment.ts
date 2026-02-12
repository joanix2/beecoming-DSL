export const environment = {
  production: false,
};
export const API_URL = (window as any).__env?.API_URL || 'https://api.opteeam.bee-dev.fr';
// export const API_URL = (window as any).__env?.API_URL || 'http://localhost:7103';
export const MINIO_URL = (window as any).__env?.MINIO_URL || 'https://api.minio.opteeam.bee-dev.fr/opteeam-files';
