export const ORDER_STATUS_VARIANT = {
  pending: 'warning',
  processing: 'primary',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'danger',
};

export const formatOrderStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
