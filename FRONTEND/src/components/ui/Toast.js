/**
 * Toast — thin wrapper around sweetalert2, matching the pattern already
 * used consistently across every admin page (Swal.fire(title, text, icon)).
 * Standardizes the customer-facing flow onto the same library instead of
 * raw browser alert()/window.confirm().
 */

import Swal from 'sweetalert2';

const toastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export const toast = {
  success: (message) => toastMixin.fire({ icon: 'success', title: message }),
  error: (message) => toastMixin.fire({ icon: 'error', title: message }),
  info: (message) => toastMixin.fire({ icon: 'info', title: message }),

  confirm: async (message, { title = 'Are you sure?', confirmText = 'Yes', danger = false } = {}) => {
    const result = await Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      confirmButtonColor: danger ? '#ef4444' : '#2563eb',
    });
    return result.isConfirmed;
  },
};

export default toast;
