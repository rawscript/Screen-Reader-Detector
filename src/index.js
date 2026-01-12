/**
 * Screen Reader Detector
 * Detects when users are likely using a screen reader and provides callbacks
 * @version 1.0.0
 */

class ScreenReaderDetector {
  constructor(options = {}) {
    this.options = {
      // Callback when screen reader is detected
      onDetect: options.onDetect || null,
      
      // Custom alert message
      alertMessage: options.alertMessage || 
        "We detected you may be using a screen reader. " +
        "Our website has a built-in screen reader that may conflict. " +
        "Would you like to disable our built-in screen reader? " +
        "Press OK to disable it, or Cancel to keep both running.",
      
      // Show confirmation dialog
      showConfirmDialog: options.showConfirmDialog !== false,
      
      // Maximum number of detection attempts
      maxChecks: options.maxChecks || 3,
      
      // Delay before initial check (ms)
      initialCheckDelay: options.initialCheckDelay || 2000,
      
      // Local storage key for user preference
      storageKey: options.storageKey || 'disableBuiltInScreenReader',
      
      // Auto-initialize
      autoInit: options.autoInit !== false,
      
      // Sensitivity for quick navigation detection
      quickNavThreshold: options.quickNavThreshold || 3,
      
      // Sensitivity for rapid tabbing detection
      rapidTabThreshold: options.rapidTabThreshold || 5,
      
      // Time window for rapid tabbing (ms)
      rapidTabWindow: options.rapidTabWindow || 3000,
      
      // Minimum accessibility features for detection
      minAccessibilityFeatures: options.minAccessibilityFeatures || 2
    };
    
    this.state = {
      detected: false,
      detectionChecks: 0,
      tabPressCount: 0,
      tabPressTimer: null,
      ariaElementsFocused: 0,
      quickNavCount: 0
    };
    
    this.listeners = [];
    
    if (this.options.autoInit) {
      this.init();
    }
  }
  
  /**
   * Initialize the detector
   */
  init() {
    this.setupEventListeners();
    this.scheduleInitialCheck();
  }
  
  /**
   * Check if screen reader has been disabled by user preference
   */
  isDisabledByUser() {
    try {
      return localStorage.getItem(this.options.storageKey) === 'true';
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check for accessibility features via media queries
   */
  checkAccessibilityFeatures() {
    const indicators = [
      window.matchMedia('(prefers-contrast: more)').matches,
      window.matchMedia('(forced-colors: active)').matches,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ];
    
    return indicators.filter(Boolean).length >= this.options.minAccessibilityFeatures;
  }
  
  /**
   * Handle tab key press for rapid navigation detection
   */
  handleTabPress(e) {
    if (e.key === 'Tab') {
      this.state.tabPressCount++;
      
      clearTimeout(this.state.tabPressTimer);
      this.state.tabPressTimer = setTimeout(() => {
        this.state.tabPressCount = 0;
      }, this.options.rapidTabWindow);
      
      if (this.state.tabPressCount >= this.options.rapidTabThreshold && 
          this.state.detectionChecks < this.options.maxChecks) {
        this.state.detectionChecks++;
        this.checkAndAlert();
      }
    }
  }
  
  /**
   * Handle focus events for ARIA element detection
   */
  handleFocus(e) {
    if (e.target && (
      e.target.hasAttribute('aria-label') ||
      e.target.hasAttribute('aria-describedby') ||
      e.target.getAttribute('role')
    )) {
      this.state.ariaElementsFocused++;
      
      if (this.state.ariaElementsFocused >= 3 && 
          this.state.detectionChecks < this.options.maxChecks) {
        this.state.detectionChecks++;
        this.checkAndAlert();
      }
    }
  }
  
  /**
   * Handle keyboard events for screen reader specific keys
   */
  handleKeyDown(e) {
    let screenReaderKeyDetected = false;
    
    // NVDA/JAWS: Insert key combinations
    if (e.key === 'Insert') {
      screenReaderKeyDetected = true;
    }
    
    // NVDA: Insert + various keys
    if (e.key === 'Insert' && (e.key === 'ArrowDown' || e.key === 'T')) {
      screenReaderKeyDetected = true;
    }
    
    // JAWS: Insert + Ctrl combinations
    if (e.key === 'Insert' && e.ctrlKey) {
      screenReaderKeyDetected = true;
    }
    
    if (e.key === 'Insert' && (e.key === 'F' || e.key === 'H')) {
      screenReaderKeyDetected = true;
    }
    
    // NumPad Insert key (Numpad 0 with NumLock off)
    if (e.code === 'Numpad0') {
      screenReaderKeyDetected = true;
    }
    
    // Caps Lock as modifier (some users remap)
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      if (['ArrowDown', 'T', 'H', 'F'].includes(e.key)) {
        screenReaderKeyDetected = true;
      }
    }
    
    // Quick navigation keys (H, K, D, F, B, L, I, T)
    // Used in browse mode by NVDA/JAWS
    if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
      if (['H', 'K', 'D', 'F', 'B', 'L', 'I', 'T'].includes(e.key.toUpperCase())) {
        this.state.quickNavCount++;
        
        if (this.state.quickNavCount >= this.options.quickNavThreshold) {
          screenReaderKeyDetected = true;
        }
        
        setTimeout(() => {
          if (this.state.quickNavCount > 0) {
            this.state.quickNavCount--;
          }
        }, 5000);
      }
    }
    
    if (screenReaderKeyDetected && 
        this.state.detectionChecks < this.options.maxChecks) {
      this.state.detectionChecks++;
      this.checkAndAlert();
    }
  }
  
  /**
   * Main detection and alert logic
   */
  checkAndAlert() {
    if (this.state.detected) return; // Already detected and handled
    
    const hasAccessibilityFeatures = this.checkAccessibilityFeatures();
    
    if (hasAccessibilityFeatures || 
        this.state.ariaElementsFocused >= 3 || 
        this.state.tabPressCount >= this.options.rapidTabThreshold) {
      
      this.state.detected = true;
      
      // Call custom callback if provided
      if (this.options.onDetect) {
        this.options.onDetect(this);
      }
      
      // Show confirmation dialog if enabled
      if (this.options.showConfirmDialog) {
        if (confirm(this.options.alertMessage)) {
          this.disableBuiltInScreenReader();
        }
      }
    }
  }
  
  /**
   * Disable the built-in screen reader
   */
  disableBuiltInScreenReader() {
    try {
      localStorage.setItem(this.options.storageKey, 'true');
    } catch (e) {
      console.warn('Could not save preference to localStorage:', e);
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('screenReaderDisabled', {
      detail: { detector: this }
    }));
    
    // Show confirmation
    alert('Built-in screen reader has been disabled. Refresh if needed.');
  }
  
  /**
   * Enable the built-in screen reader
   */
  enableBuiltInScreenReader() {
    try {
      localStorage.removeItem(this.options.storageKey);
    } catch (e) {
      console.warn('Could not remove preference from localStorage:', e);
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('screenReaderEnabled', {
      detail: { detector: this }
    }));
  }
  
  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    const tabHandler = this.handleTabPress.bind(this);
    const focusHandler = this.handleFocus.bind(this);
    const keyHandler = this.handleKeyDown.bind(this);
    
    document.addEventListener('keydown', tabHandler);
    document.addEventListener('focusin', focusHandler);
    document.addEventListener('keydown', keyHandler);
    
    // Store listeners for cleanup
    this.listeners.push(
      { element: document, event: 'keydown', handler: tabHandler },
      { element: document, event: 'focusin', handler: focusHandler },
      { element: document, event: 'keydown', handler: keyHandler }
    );
  }
  
  /**
   * Schedule the initial accessibility check
   */
  scheduleInitialCheck() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (this.checkAccessibilityFeatures() && 
            this.state.detectionChecks < this.options.maxChecks) {
          this.checkAndAlert();
        }
      }, this.options.initialCheckDelay);
    });
  }
  
  /**
   * Cleanup and remove event listeners
   */
  destroy() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
    
    if (this.state.tabPressTimer) {
      clearTimeout(this.state.tabPressTimer);
    }
  }
  
  /**
   * Get current detection state
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Check if screen reader was detected
   */
  isDetected() {
    return this.state.detected;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenReaderDetector;
}

if (typeof window !== 'undefined') {
  window.ScreenReaderDetector = ScreenReaderDetector;
}