/**
 * Authentication Manager
 * Handles session-based authentication for meeting booking system
 * Implements 8-hour session with automatic logout and daily reset
 */

export class AuthenticationManager {
  constructor() {
    this.sessionKey = "meetingBookingSession";
    this.sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds (original)

    this.passwordModal = null;
    this.isAuthenticated = false;
    this.sessionTimer = null;

    // Configuration
    this.config = {
      password: "1234", // Simple 4-digit PIN for demo
      sessionWarningTime: 30 * 60 * 1000, // 30 minutes before expiry (original)
      maxAttempts: 3,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes lockout
    };

    this.init();
  }

  /**
   * Initialize authentication system
   */
  init() {
    this.createPasswordModal();
    this.checkExistingSession();
    this.setupSessionWarning();

    console.log("#################### Authentication Manager initialized");
  }

  /**
   * Create password input modal with meeting-detail-tooltip design
   */
  createPasswordModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById("passwordModal");
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
      <div id="passwordModal" class="password-modal-overlay">
        <div class="password-modal">
          <div class="password-modal-header">
            <h3 class="password-modal-title">
              <i class="fas fa-lock password-title-icon"></i>
              Xác thực để đặt phòng họp
            </h3>
            <div class="password-session-info">
              <div class="session-status-dot"></div>
              Phiên làm việc 8 giờ
            </div>
          </div>
          
          <div class="password-modal-body">
            <div class="password-info-grid">
              <div class="password-info-row">
                <i class="fas fa-info-circle info-icon"></i>
                <div class="info-content">
                  <div class="info-label">Thông tin xác thực</div>
                  <div class="info-value">Nhập mật khẩu để truy cập chức năng đặt phòng họp trong 8 giờ làm việc</div>
                </div>
              </div>
              
              <div class="password-input-row">
                <i class="fas fa-key info-icon"></i>
                <div class="info-content">
                  <div class="info-label">Mật khẩu</div>
                  <div class="password-input-container">
                    <input type="password" id="passwordInput" class="password-input" placeholder="Nhập mật khẩu..." maxlength="10" autocomplete="off">
                    <button type="button" id="togglePasswordVisibility" class="toggle-password-btn">
                        <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div id="passwordError" class="password-error-row" style="display: none;">
                <i class="fas fa-exclamation-triangle info-icon error"></i>
                <div class="info-content">
                  <div class="info-label error">Lỗi xác thực</div>
                  <div class="info-value error" id="passwordErrorMessage"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="password-modal-footer">
            <button type="button" class="password-action-btn secondary" id="cancelPasswordBtn">
              <i class="fas fa-times"></i>
              Hủy bỏ
            </button>
            <button type="button" class="password-action-btn primary" id="submitPasswordBtn">
              <i class="fas fa-check"></i>
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    this.passwordModal = document.getElementById("passwordModal");
    this.attachPasswordModalEvents();
  }

  /**
   * Attach event listeners to password modal
   */
  attachPasswordModalEvents() {
    const passwordInput = document.getElementById("passwordInput");
    const submitBtn = document.getElementById("submitPasswordBtn");
    const cancelBtn = document.getElementById("cancelPasswordBtn");
    const toggleBtn = document.getElementById("togglePasswordVisibility");

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
      this.hidePasswordModal();
    });

    // Toggle password visibility
    toggleBtn.addEventListener("click", () => {
      this.togglePasswordVisibility();
    });

    // Remove background click to close - only allow cancel button
    // this.passwordModal.addEventListener("click", (e) => {
    //   if (e.target === this.passwordModal) {
    //     this.hidePasswordModal();
    //   }
    // });

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
      document.getElementById("passwordInput").focus();
    }, 10);
  }

  /**
   * Hide password modal
   */
  hidePasswordModal() {
    if (!this.passwordModal) return;

    this.passwordModal.classList.remove("show");
    setTimeout(() => {
      this.passwordModal.style.display = "none";
      this.clearPasswordForm();
    }, 300);
  }

  /**
   * Clear password form
   */
  clearPasswordForm() {
    const passwordInput = document.getElementById("passwordInput");
    const errorRow = document.getElementById("passwordError");

    if (passwordInput) passwordInput.value = "";
    if (errorRow) errorRow.style.display = "none";
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    const passwordInput = document.getElementById("passwordInput");
    const toggleBtn = document.getElementById("togglePasswordVisibility");
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
   * Submit password for authentication
   */
  async submitPassword() {
    const passwordInput = document.getElementById("passwordInput");
    const submitBtn = document.getElementById("submitPasswordBtn");
    const password = passwordInput.value.trim();

    if (!password) {
      this.showPasswordError("Vui lòng nhập mật khẩu");
      return;
    }

    // Show loading state
    this.setSubmitButtonLoading(true);

    try {
      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (password === this.config.password) {
        this.setAuthenticated(true);
        this.hidePasswordModal();
      } else {
        this.handleFailedAttempt();
      }
    } catch (error) {
      console.error("Authentication error:", error);
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
    } else {
      const remaining = this.config.maxAttempts - attempts;
      this.showPasswordError(`Mật khẩu không đúng. Còn ${remaining} lần thử.`);
    }
  }

  /**
   * Show password error
   */
  showPasswordError(message) {
    const errorRow = document.getElementById("passwordError");
    const errorMessage = document.getElementById("passwordErrorMessage");

    if (errorRow && errorMessage) {
      errorMessage.textContent = message;
      errorRow.style.display = "flex";
    }
  }

  /**
   * Set submit button loading state
   */
  setSubmitButtonLoading(loading) {
    const submitBtn = document.getElementById("submitPasswordBtn");
    const icon = submitBtn.querySelector("i");

    if (loading) {
      submitBtn.disabled = true;
      icon.className = "fas fa-spinner fa-spin";
      submitBtn.style.opacity = "0.7";
    } else {
      submitBtn.disabled = false;
      icon.className = "fas fa-check";
      submitBtn.style.opacity = "1";
    }
  }

  /**
   * Set authenticated state and create session
   */
  setAuthenticated(isAuth) {
    this.isAuthenticated = isAuth;

    if (isAuth) {
      const sessionData = {
        timestamp: Date.now(),
        expiresAt: Date.now() + this.sessionDuration,
        dailyDate: new Date().toDateString(),
      };

      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      this.resetFailedAttempts();
      this.setupSessionTimer(sessionData.expiresAt);

      console.log("#################### Authentication session created");
    } else {
      localStorage.removeItem(this.sessionKey);
      this.clearSessionTimer();
      console.log("#################### Authentication session cleared");
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isUserAuthenticated() {
    const sessionData = this.getSessionData();

    if (!sessionData) return false;

    // Check if session has expired
    if (Date.now() > sessionData.expiresAt) {
      this.setAuthenticated(false);
      return false;
    }

    // Check if it's a new day (require re-authentication)
    const currentDate = new Date().toDateString();
    if (sessionData.dailyDate !== currentDate) {
      this.setAuthenticated(false);
      this.showSessionExpiredNotification(
        "Đã sang ngày mới, vui lòng xác thực lại để tiếp tục sử dụng."
      );
      return false;
    }

    return true;
  }

  /**
   * Get session data from localStorage
   */
  getSessionData() {
    try {
      const data = localStorage.getItem(this.sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error reading session data:", error);
      return null;
    }
  }

  /**
   * Check existing session on init
   */
  checkExistingSession() {
    if (this.isUserAuthenticated()) {
      this.isAuthenticated = true;
      const sessionData = this.getSessionData();
      this.setupSessionTimer(sessionData.expiresAt);
      console.log("#################### Existing valid session found");
    }
  }

  /**
   * Setup session timer for automatic logout
   */
  setupSessionTimer(expiresAt) {
    this.clearSessionTimer();

    const timeUntilExpiry = expiresAt - Date.now();

    if (timeUntilExpiry > 0) {
      this.sessionTimer = setTimeout(() => {
        this.handleSessionExpiry();
      }, timeUntilExpiry);

      console.log(
        `#################### Session timer set for ${Math.round(
          timeUntilExpiry / 1000
        )} seconds (test mode)`
      );
    }
  }

  /**
   * Clear session timer
   */
  clearSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Handle session expiry
   */
  handleSessionExpiry() {
    this.setAuthenticated(false);
    this.showSessionExpiredNotification(
      "Phiên làm việc đã hết hạn. Vui lòng xác thực lại để tiếp tục sử dụng."
    );
  }

  /**
   * Setup session warning system
   */
  setupSessionWarning() {
    // Check session status every 10 seconds for testing
    setInterval(() => {
      if (!this.isAuthenticated) return;

      const sessionData = this.getSessionData();
      if (!sessionData) return;

      const timeLeft = sessionData.expiresAt - Date.now();
    }, 10 * 1000); // Check every 10 seconds for testing
    // }, 5 * 60 * 1000); // Check every 5 minutes (original)
  }

  /**
   * Get/Set failed attempts for lockout mechanism
   */
  getFailedAttempts() {
    try {
      return parseInt(localStorage.getItem("passwordFailedAttempts") || "0");
    } catch {
      return 0;
    }
  }

  setFailedAttempts(attempts) {
    localStorage.setItem("passwordFailedAttempts", attempts.toString());
  }

  resetFailedAttempts() {
    localStorage.removeItem("passwordFailedAttempts");
  }

  setLockout() {
    const lockoutUntil = Date.now() + this.config.lockoutDuration;
    localStorage.setItem("passwordLockoutUntil", lockoutUntil.toString());
  }

  isLockedOut() {
    try {
      const lockoutUntil = parseInt(
        localStorage.getItem("passwordLockoutUntil") || "0"
      );
      return Date.now() < lockoutUntil;
    } catch {
      return false;
    }
  }

  /**
   * Request authentication for booking
   */
  async requestAuthentication() {
    return new Promise((resolve) => {
      if (this.isUserAuthenticated()) {
        resolve(true);
        return;
      }

      if (this.isLockedOut()) {
        this.showErrorNotification(
          "Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần."
        );
        resolve(false);
        return;
      }

      // Show password modal and wait for result
      this.showPasswordModal();

      // Listen for authentication result
      const checkAuth = () => {
        if (this.isAuthenticated) {
          resolve(true);
        } else {
          setTimeout(checkAuth, 100);
        }
      };

      checkAuth();
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
   * Show session warning notification
   */
  showSessionWarningNotification(message) {
    this.showNotification(message, "warning");
  }

  /**
   * Show session expired notification
   */
  showSessionExpiredNotification(message) {
    this.showNotification(message, "expired");
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `auth-notification auth-notification-${type}`;

    const iconMap = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      expired: "fas fa-clock",
      info: "fas fa-info-circle",
    };

    notification.innerHTML = `
      <div class="auth-notification-content">
        <i class="${iconMap[type]}"></i>
        <span>${message}</span>
        <button class="auth-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Auto remove after duration
    const duration = type === "error" ? 8000 : 5000;
    setTimeout(() => {
      notification.remove();
    }, duration);
  }

  /**
   * Get remaining session time in minutes
   */
  getRemainingSessionTime() {
    const sessionData = this.getSessionData();
    if (!sessionData) return 0;

    const timeLeft = sessionData.expiresAt - Date.now();
    // return Math.max(0, Math.round(timeLeft / 60000)); // Original: minutes
    return Math.max(0, Math.round(timeLeft / 1000)); // Test mode: seconds
  }

  /**
   * Extend session (optional feature)
   */
  extendSession() {
    if (!this.isAuthenticated) return false;

    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    sessionData.expiresAt = Date.now() + this.sessionDuration;
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    this.setupSessionTimer(sessionData.expiresAt);
    return true;
  }

  /**
   * Manual logout
   */
  logout() {
    this.setAuthenticated(false);
    this.showSuccessNotification("Đã đăng xuất thành công.");
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.clearSessionTimer();
    if (this.passwordModal) {
      this.passwordModal.remove();
    }
  }
}

// Export for ES6 modules
export default AuthenticationManager;

// Also expose globally for direct access
window.AuthenticationManager = AuthenticationManager;
