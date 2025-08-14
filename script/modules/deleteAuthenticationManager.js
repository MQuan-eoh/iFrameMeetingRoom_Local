/**
 * Delete Authentication Manager
 * Handles one-time authentication for meeting deletion functionality
 * Always requires password confirmation for each delete operation
 */

export class DeleteAuthenticationManager {
  constructor() {
    this.passwordModal = null;
    this.isAuthenticating = false;
    this.currentResolve = null;

    // Configuration - reuse same password as main auth system
    this.config = {
      password: "1234", // Same password as AuthenticationManager
      maxAttempts: 3,
      lockoutDuration: 5 * 60 * 1000, // 5 minutes lockout for delete operations
    };

    console.log(
      "#################### Delete Authentication Manager initialized"
    );
    this.init();
  }

  /**
   * Initialize delete authentication system
   */
  init() {
    this.createPasswordModal();
  }

  /**
   * Create password input modal for delete operations
   */
  createPasswordModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById("deletePasswordModal");
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
      <div id="deletePasswordModal" class="delete-password-modal-overlay">
        <div class="delete-password-modal">
          <div class="delete-password-modal-header">
            <h3 class="delete-password-modal-title">
              Xác thực để xóa cuộc họp
            </h3>
            <div class="delete-password-session-info">
              <div class="delete-session-status-dot"></div>
              Xác thực một lần
            </div>
          </div>
          
          <div class="delete-password-modal-body">
            <div class="delete-password-info-grid">
              <div class="delete-password-info-row">
                <div class="delete-info-content">
                  <div class="delete-info-label">Thông tin xác thực</div>
                  <div class="delete-info-value">Nhập mật khẩu để xác nhận việc xóa cuộc họp. Bạn sẽ cần nhập mật khẩu cho mỗi lần xóa.</div>
                </div>
              </div>
              
              <div class="delete-password-input-row">
                <div class="delete-info-content">
                  <div class="delete-info-label">Mật khẩu</div>
                  <div class="delete-password-input-container">
                    <input type="password" id="deletePasswordInput" class="delete-password-input" placeholder="Nhập mật khẩu..." maxlength="10" autocomplete="off">
                    <button type="button" id="deleteTogglePasswordVisibility" class="delete-toggle-password-btn">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div id="deletePasswordError" class="delete-password-error-row" style="display: none;">
                <div class="delete-info-content">
                  <div class="delete-info-label error">Lỗi xác thực</div>
                  <div class="delete-info-value error" id="deletePasswordErrorMessage"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="delete-password-modal-footer">
            <button type="button" class="delete-password-action-btn secondary" id="deleteCancelPasswordBtn">
              Hủy bỏ
            </button>
            <button type="button" class="delete-password-action-btn primary" id="deleteSubmitPasswordBtn">
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    this.passwordModal = document.getElementById("deletePasswordModal");
    this.attachPasswordModalEvents();
  }

  /**
   * Attach event listeners to password modal
   */
  attachPasswordModalEvents() {
    const passwordInput = document.getElementById("deletePasswordInput");
    const submitBtn = document.getElementById("deleteSubmitPasswordBtn");
    const cancelBtn = document.getElementById("deleteCancelPasswordBtn");
    const toggleBtn = document.getElementById("deleteTogglePasswordVisibility");

    // Submit on Enter key
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.submitPassword();
      }
    });

    // Submit button
    submitBtn.addEventListener("click", () => {
      this.submitPassword();
    });

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      this.hidePasswordModal(false);
    });

    // Prevent background click to close - force user decision
    this.passwordModal.addEventListener("click", (e) => {
      if (e.target === this.passwordModal) {
        // Shake modal to indicate action required
        this.shakeModal();
      }
    });

    // Focus password input when modal shows
    passwordInput.focus();
  }

  /**
   * Show password modal
   */
  showPasswordModal() {
    if (!this.passwordModal) return;

    this.passwordModal.style.display = "flex";
    setTimeout(() => {
      this.passwordModal.classList.add("show");
      document.getElementById("deletePasswordInput").focus();
    }, 10);
  }

  /**
   * Hide password modal
   */
  hidePasswordModal(success = false) {
    if (!this.passwordModal) return;

    this.passwordModal.classList.remove("show");
    setTimeout(() => {
      this.passwordModal.style.display = "none";
      this.clearPasswordForm();

      // Resolve the pending promise
      if (this.currentResolve) {
        this.currentResolve(success);
        this.currentResolve = null;
      }

      this.isAuthenticating = false;
    }, 300);
  }

  /**
   * Clear password form
   */
  clearPasswordForm() {
    const passwordInput = document.getElementById("deletePasswordInput");
    const errorRow = document.getElementById("deletePasswordError");

    if (passwordInput) passwordInput.value = "";
    if (errorRow) errorRow.style.display = "none";
  }
  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    const passwordInput = document.getElementById("deletePasswordInput");
    const toggleBtn = document.getElementById("deleteTogglePasswordVisibility");
    const icon = toggleBtn.querySelector("i");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.className = "fas fa-eye-slash";
    } else {
      passwordInput.type = "password";
      icon.className = "fas fa-eye";
    }
  }

  /**
   * Shake modal for attention
   */
  shakeModal() {
    const modal = this.passwordModal.querySelector(".delete-password-modal");
    modal.classList.add("shake");
    setTimeout(() => {
      modal.classList.remove("shake");
    }, 500);
  }

  /**
   * Submit password for authentication
   */
  async submitPassword() {
    const passwordInput = document.getElementById("deletePasswordInput");
    const password = passwordInput.value.trim();

    if (!password) {
      this.showPasswordError("Vui lòng nhập mật khẩu");
      return;
    }

    // Show loading state
    this.setSubmitButtonLoading(true);

    try {
      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (password === this.config.password) {
        this.resetFailedAttempts();
        this.showSuccessNotification("Xác thực thành công!");
        setTimeout(() => {
          this.hidePasswordModal(true);
        }, 800);
      } else {
        this.handleFailedAttempt();
      }
    } catch (error) {
      console.error("Delete authentication error:", error);
      this.showPasswordError("Có lỗi xảy ra trong quá trình xác thực");
    } finally {
      this.setSubmitButtonLoading(false);
    }
  }

  /**
   * Handle failed authentication attempt
   */
  handleFailedAttempt() {
    const attempts = this.getFailedAttempts() + 1;
    this.setFailedAttempts(attempts);

    if (attempts >= this.config.maxAttempts) {
      this.setLockout();
      this.showPasswordError(
        `Quá nhiều lần thử sai. Vui lòng thử lại sau ${
          this.config.lockoutDuration / 60000
        } phút.`
      );
      setTimeout(() => {
        this.hidePasswordModal(false);
      }, 2000);
    } else {
      const remaining = this.config.maxAttempts - attempts;
      this.showPasswordError(`Mật khẩu không đúng. Còn ${remaining} lần thử.`);

      // Clear input for retry
      const passwordInput = document.getElementById("deletePasswordInput");
      if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
      }
    }
  }

  /**
   * Show password error
   */
  showPasswordError(message) {
    const errorRow = document.getElementById("deletePasswordError");
    const errorMessage = document.getElementById("deletePasswordErrorMessage");

    if (errorRow && errorMessage) {
      errorMessage.textContent = message;
      errorRow.style.display = "flex";

      // Shake modal to draw attention
      this.shakeModal();
    }
  }

  /**
   * Set submit button loading state
   */
  setSubmitButtonLoading(loading) {
    const submitBtn = document.getElementById("deleteSubmitPasswordBtn");

    if (loading) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang xác thực...";
      submitBtn.style.opacity = "0.7";
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "Xác nhận";
      submitBtn.style.opacity = "1";
    }
  }

  /**
   * Get/Set failed attempts for lockout mechanism (delete-specific)
   */
  getFailedAttempts() {
    try {
      return parseInt(
        localStorage.getItem("deletePasswordFailedAttempts") || "0"
      );
    } catch {
      return 0;
    }
  }

  setFailedAttempts(attempts) {
    localStorage.setItem("deletePasswordFailedAttempts", attempts.toString());
  }

  resetFailedAttempts() {
    localStorage.removeItem("deletePasswordFailedAttempts");
  }

  setLockout() {
    const lockoutUntil = Date.now() + this.config.lockoutDuration;
    localStorage.setItem("deletePasswordLockoutUntil", lockoutUntil.toString());
  }

  isLockedOut() {
    try {
      const lockoutUntil = parseInt(
        localStorage.getItem("deletePasswordLockoutUntil") || "0"
      );
      return Date.now() < lockoutUntil;
    } catch {
      return false;
    }
  }

  /**
   * Request authentication for delete operation
   * This is called every time user wants to delete meetings
   */
  async requestDeleteAuthentication() {
    return new Promise((resolve) => {
      // Check if already authenticating
      if (this.isAuthenticating) {
        resolve(false);
        return;
      }

      // Check lockout status
      if (this.isLockedOut()) {
        this.showErrorNotification(
          "Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần khi xóa cuộc họp."
        );
        resolve(false);
        return;
      }

      // Set authenticating state
      this.isAuthenticating = true;
      this.currentResolve = resolve;

      // Show password modal - always require authentication
      this.showPasswordModal();

      console.log("#################### Delete authentication requested");
    });
  }

  /**
   * Show success notification
   */
  showSuccessNotification(message) {
    this.showNotification(message, "success");
  }

  /**
   * Show error notification
   */
  showErrorNotification(message) {
    this.showNotification(message, "error");
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `delete-auth-notification delete-auth-notification-${type}`;

    const titleMap = {
      success: "Thành công",
      error: "Lỗi",
      info: "Thông tin",
      warning: "Cảnh báo",
    };

    notification.innerHTML = `
      <div class="delete-auth-notification-content">
        <div class="delete-auth-notification-text">
          <div class="delete-auth-notification-title">${titleMap[type]}</div>
          <div class="delete-auth-notification-message">${message}</div>
        </div>
        <button class="delete-auth-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Auto remove after duration
    const duration = type === "error" ? 6000 : 3000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  /**
   * Check if currently authenticating
   */
  isCurrentlyAuthenticating() {
    return this.isAuthenticating;
  }

  /**
   * Cancel current authentication process
   */
  cancelAuthentication() {
    if (this.isAuthenticating) {
      this.hidePasswordModal(false);
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.passwordModal) {
      this.passwordModal.remove();
    }

    if (this.currentResolve) {
      this.currentResolve(false);
      this.currentResolve = null;
    }

    this.isAuthenticating = false;

    console.log("#################### Delete Authentication Manager destroyed");
  }
}

// Export for ES6 modules
export default DeleteAuthenticationManager;

// Also expose globally for direct access
window.DeleteAuthenticationManager = DeleteAuthenticationManager;
