// public/js/main.js
// Client-side interactions: modals, toasts, drawer navigation, and input validations

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto-dismiss Toast Notifications
  const toasts = document.querySelectorAll('.toast');
  toasts.forEach(toast => {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      });
    }
  });

  // 2. Mobile Sidebar Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // 3. Modals System (Return Modal, Reject Modal)
  window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  };

  window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  };

  // Close modals when clicking overlay backdrop
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // 4. Return Modal Population Helper (for Lab In-charge)
  window.setupReturnModal = (requestId, assetName, requesterName, quantity) => {
    const modal = document.getElementById('returnModal');
    if (!modal) return;

    const inputRequestId = modal.querySelector('#returnRequestId');
    const displayInfo = modal.querySelector('#returnItemSummary');

    if (inputRequestId) inputRequestId.value = requestId;
    if (displayInfo) {
      displayInfo.textContent = `${quantity}x ${assetName} (Borrowed by: ${requesterName})`;
    }

    openModal('returnModal');
  };

  // 5. Reject Modal Population Helper
  window.setupRejectModal = (requestId, assetName) => {
    const modal = document.getElementById('rejectModal');
    if (!modal) return;

    const inputRequestId = modal.querySelector('#rejectRequestId');
    const displayInfo = modal.querySelector('#rejectItemSummary');

    if (inputRequestId) inputRequestId.value = requestId;
    if (displayInfo) displayInfo.textContent = `Rejecting request for ${assetName}`;

    openModal('rejectModal');
  };

  // 6. Client-Side Quantity & Date Validation for Issue Request Form
  const requestForm = document.querySelector('#equipmentRequestForm');
  if (requestForm) {
    const qtyInput = requestForm.querySelector('#requestQuantity');
    const availableQty = parseInt(qtyInput ? qtyInput.getAttribute('max') : 0, 10);
    const dateInput = requestForm.querySelector('#expectedReturnDate');
    const errorDisplay = requestForm.querySelector('#requestFormError');

    // Set min date to today
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    requestForm.addEventListener('submit', (e) => {
      if (qtyInput) {
        const val = parseInt(qtyInput.value, 10);
        if (isNaN(val) || val <= 0) {
          e.preventDefault();
          showFormError(errorDisplay, 'Please enter a valid quantity of at least 1.');
          return;
        }
        if (val > availableQty) {
          e.preventDefault();
          showFormError(errorDisplay, `You cannot request more units than currently available (${availableQty} in stock).`);
          return;
        }
      }

      if (dateInput && !dateInput.value) {
        e.preventDefault();
        showFormError(errorDisplay, 'Please select an expected return date.');
        return;
      }
    });
  }

  function showFormError(element, message) {
    if (!element) {
      alert(message);
      return;
    }
    element.textContent = message;
    element.style.display = 'block';
  }
});
