/**
 * Teams-style Time Dropdown functionality
 *
 * This module provides enhancements to make time dropdowns work like Microsoft Teams
 * FIXED: Remove native datalist and use custom dropdown only
 */

/**
 * Initialize Teams-style time dropdown behavior
 */
export function initTeamsTimeDropdown() {
  const startTimeInput = document.getElementById("bookingStartTime");
  const endTimeInput = document.getElementById("bookingEndTime");
  const startTimeDropdown = document.getElementById("startTimeOptions");
  const endTimeDropdown = document.getElementById("endTimeOptions");

  // Create full day time options (30 min intervals)
  createFullDayTimeOptions();

  if (startTimeInput && startTimeDropdown) {
    // Toggle dropdown visibility when clicking on the input
    startTimeInput.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🕐 Start time input clicked");

      // Hide all other dropdowns first
      hideAllDropdowns();
      // Show the start time dropdown
      toggleTimeDropdown(startTimeDropdown, true);
      startTimeInput.focus();
    });

    // Also handle focus event to show dropdown
    startTimeInput.addEventListener("focus", (e) => {
      console.log("🕐 Start time input focused");
      hideAllDropdowns();
      toggleTimeDropdown(startTimeDropdown, true);
    });

    // Hide dropdown when clicking outside (with longer delay)
    startTimeInput.addEventListener("blur", (e) => {
      console.log("🕐 Start time input blur");
      setTimeout(() => {
        // Only hide if no option was clicked
        if (!startTimeDropdown.classList.contains("option-clicked")) {
          toggleTimeDropdown(startTimeDropdown, false);
        }
      }, 300);
    });
  }

  if (endTimeInput && endTimeDropdown) {
    // Toggle dropdown visibility when clicking on the input
    endTimeInput.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🕐 End time input clicked");

      // Hide all other dropdowns first
      hideAllDropdowns();
      // Show the end time dropdown
      toggleTimeDropdown(endTimeDropdown, true);
      endTimeInput.focus();
    });

    // Also handle focus event to show dropdown
    endTimeInput.addEventListener("focus", (e) => {
      console.log("🕐 End time input focused");
      hideAllDropdowns();
      toggleTimeDropdown(endTimeDropdown, true);
    });

    // Hide dropdown when clicking outside (with longer delay)
    endTimeInput.addEventListener("blur", (e) => {
      console.log("🕐 End time input blur");
      setTimeout(() => {
        // Only hide if no option was clicked
        if (!endTimeDropdown.classList.contains("option-clicked")) {
          toggleTimeDropdown(endTimeDropdown, false);
        }
      }, 300);
    });
  }

  // Hide dropdowns when clicking anywhere else
  document.addEventListener("click", (e) => {
    const isTimeInput = e.target.closest("#bookingStartTime, #bookingEndTime");
    const isDropdown = e.target.closest(".custom-time-dropdown");
    const isFormGroup = e.target.closest(".form-group");

    if (!isTimeInput && !isDropdown) {
      console.log("🕐 Clicking outside, hiding all dropdowns");
      hideAllDropdowns();
    }
  });
}

/**
 * Create time options with 30-minute intervals for full day (00:00 to 23:30)
 */
export function createFullDayTimeOptions() {
  const startTimeDropdown = document.getElementById("startTimeOptions");
  const endTimeDropdown = document.getElementById("endTimeOptions");

  console.log("🕐 Creating full day time options...");
  console.log("🕐 startTimeDropdown:", startTimeDropdown);
  console.log("🕐 endTimeDropdown:", endTimeDropdown);

  if (!startTimeDropdown || !endTimeDropdown) {
    console.error("🕐 Could not find dropdown elements!");
    return;
  }

  // Clear existing options
  startTimeDropdown.innerHTML = "";
  endTimeDropdown.innerHTML = "";

  let optionsCreated = 0;

  // Create time options for every 30 minutes throughout the day
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const timeValue = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      // Create option for start time
      const startOption = document.createElement("div");
      startOption.className = "time-option";
      startOption.textContent = timeValue;
      startOption.setAttribute("data-time", timeValue);

      // Add click handler for start time option
      startOption.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`🕐 Start time option clicked: ${timeValue}`);

        // Mark that an option was clicked to prevent blur from hiding dropdown
        startTimeDropdown.classList.add("option-clicked");

        const startTimeInput = document.getElementById("bookingStartTime");
        startTimeInput.value = timeValue;
        console.log(
          `🕐 Set start time input value to: ${startTimeInput.value}`
        );

        // Small delay to ensure value is set
        setTimeout(() => {
          toggleTimeDropdown(startTimeDropdown, false);
          startTimeDropdown.classList.remove("option-clicked");

          // Update end time options based on new start time
          updateEndTimeOptions();

          // Focus the end time input after selecting start time
          const endTimeInput = document.getElementById("bookingEndTime");
          if (endTimeInput) {
            endTimeInput.focus();
            // Show end time dropdown
            const endTimeDropdown = document.getElementById("endTimeOptions");
            if (endTimeDropdown) {
              setTimeout(() => {
                toggleTimeDropdown(endTimeDropdown, true);
              }, 100);
            }
          }
        }, 50);
      });

      startTimeDropdown.appendChild(startOption);

      // Create option for end time
      const endOption = document.createElement("div");
      endOption.className = "time-option";
      endOption.textContent = timeValue;
      endOption.setAttribute("data-time", timeValue);

      // Add click handler for end time option
      endOption.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`🕐 End time option clicked: ${timeValue}`);

        // Mark that an option was clicked to prevent blur from hiding dropdown
        endTimeDropdown.classList.add("option-clicked");

        const endTimeInput = document.getElementById("bookingEndTime");
        endTimeInput.value = timeValue;
        console.log(`🕐 Set end time input value to: ${endTimeInput.value}`);

        // Small delay to ensure value is set
        setTimeout(() => {
          toggleTimeDropdown(endTimeDropdown, false);
          endTimeDropdown.classList.remove("option-clicked");
        }, 50);
      });

      endTimeDropdown.appendChild(endOption);
      optionsCreated++;
    }
  }

  console.log(`🕐 Created ${optionsCreated} time options for each dropdown`);
  console.log(
    `🕐 Start dropdown children count: ${startTimeDropdown.children.length}`
  );
  console.log(
    `🕐 End dropdown children count: ${endTimeDropdown.children.length}`
  );

  // Get current time to highlight suggested options
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Round up to next 30-minute interval for suggestion
  let suggestedHour = currentHour;
  let suggestedMinute = currentMinute <= 30 ? 30 : 0;

  if (suggestedMinute === 0) {
    suggestedHour += 1;
  }

  // If it's past working hours, suggest from 7 AM next day
  if (suggestedHour >= 19) {
    suggestedHour = 7;
    suggestedMinute = 0;
  } else if (suggestedHour < 7) {
    suggestedHour = 7;
    suggestedMinute = 0;
  }

  // Highlight the suggested time option
  const suggestedTime = `${suggestedHour
    .toString()
    .padStart(2, "0")}:${suggestedMinute.toString().padStart(2, "0")}`;

  console.log(`🕐 Suggested time: ${suggestedTime}`);

  // Find and highlight suggested option
  const startOptions = startTimeDropdown.querySelectorAll(".time-option");
  startOptions.forEach((option) => {
    if (option.getAttribute("data-time") === suggestedTime) {
      option.classList.add("selected");
      console.log(`🕐 Highlighted suggested start time: ${suggestedTime}`);
    }
  });
}

/**
 * Update end time options based on selected start time
 */
export function updateEndTimeOptions() {
  const startTimeInput = document.getElementById("bookingStartTime");
  const endTimeDropdown = document.getElementById("endTimeOptions");

  if (!startTimeInput || !endTimeDropdown) return;

  // Create full day options
  createFullDayTimeOptions();

  const startTimeValue = startTimeInput.value.trim();
  if (!startTimeValue) return;

  // Basic validation
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTimeValue)) return;

  // Get start time value
  const [startHour, startMinute] = startTimeValue.split(":").map(Number);

  // Calculate minimum end time (start time + 30 minutes)
  let minEndHour = startHour;
  let minEndMinute = startMinute + 30;

  if (minEndMinute >= 60) {
    minEndHour += 1;
    minEndMinute -= 60;
  }

  // The minimum end time to highlight
  const minEndTime = `${minEndHour.toString().padStart(2, "0")}:${minEndMinute
    .toString()
    .padStart(2, "0")}`;

  // Highlight and scroll to the suggested minimum end time
  const endOptions = endTimeDropdown.querySelectorAll(".time-option");
  endOptions.forEach((option) => {
    const optionTime = option.getAttribute("data-time");
    const [optionHour, optionMinute] = optionTime.split(":").map(Number);
    const optionMinutes = optionHour * 60 + optionMinute;
    const minEndMinutes = minEndHour * 60 + minEndMinute;

    // Reset styles first
    option.classList.remove("selected");
    option.style.opacity = "";
    option.style.color = "";

    if (optionTime === minEndTime) {
      // This is the suggested minimum end time - highlight it
      option.classList.add("selected");

      // Scroll to this option when dropdown opens
      setTimeout(() => {
        if (option.scrollIntoView) {
          option.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else if (optionMinutes < minEndMinutes) {
      // These times are before the minimum end time - dim them
      option.style.opacity = "0.5";
      option.style.color = "#999";
    }
  });
}

/**
 * Hide all time dropdowns
 */
export function hideAllDropdowns() {
  const dropdowns = document.querySelectorAll(".custom-time-dropdown");
  dropdowns.forEach((dropdown) => {
    dropdown.classList.remove("show");
  });
}

/**
 * Toggle time dropdown visibility
 * @param {HTMLElement} dropdown The dropdown element to toggle
 * @param {boolean} show Whether to show or hide the dropdown
 */
export function toggleTimeDropdown(dropdown, show) {
  if (!dropdown) {
    console.warn("🕐 toggleTimeDropdown: dropdown element not found");
    return;
  }

  console.log(
    `🕐 toggleTimeDropdown: ${show ? "showing" : "hiding"} dropdown`,
    dropdown.id
  );

  if (show) {
    dropdown.classList.add("show");
    console.log(
      `🕐 Dropdown ${dropdown.id} now has classes:`,
      dropdown.className
    );
  } else {
    dropdown.classList.remove("show");
    dropdown.classList.remove("option-clicked");
    console.log(
      `🕐 Dropdown ${dropdown.id} now has classes:`,
      dropdown.className
    );
  }
}
