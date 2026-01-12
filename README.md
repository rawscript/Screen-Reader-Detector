# Screen Reader Detector

A lightweight JavaScript library to detect when users are using screen readers (NVDA, JAWS, etc.) to prevent conflicts with built-in accessibility features.

## Installation
```bash
npm install screen-reader-detector
```

Or use via CDN:
```html
<script src="https://unpkg.com/screen-reader-detector@1.0.0/dist/screen-reader-detector.min.js"></script>
```

## Quick Start

### Basic Usage
```javascript
import ScreenReaderDetector from 'screen-reader-detector';

const detector = new ScreenReaderDetector({
  onDetect: (detector) => {
    console.log('Screen reader detected!');
    // Disable your built-in screen reader here
    myScreenReader.disable();
  }
});
```

### Without Confirmation Dialog
```javascript
const detector = new ScreenReaderDetector({
  showConfirmDialog: false,
  onDetect: (detector) => {
    // Automatically disable without asking
    myScreenReader.disable();
  }
});
```

### Custom Alert Message
```javascript
const detector = new ScreenReaderDetector({
  alertMessage: 'Custom message for your users...',
  onDetect: (detector) => {
    // Your logic here
  }
});
```

### Manual Initialization
```javascript
const detector = new ScreenReaderDetector({
  autoInit: false
});

// Later...
detector.init();
```

## API

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onDetect` | Function | `null` | Callback when screen reader is detected |
| `alertMessage` | String | Default message | Custom confirmation dialog message |
| `showConfirmDialog` | Boolean | `true` | Show confirmation dialog on detection |
| `maxChecks` | Number | `3` | Maximum detection attempts |
| `initialCheckDelay` | Number | `2000` | Delay before initial check (ms) |
| `storageKey` | String | `'disableBuiltInScreenReader'` | LocalStorage key for preference |
| `autoInit` | Boolean | `true` | Auto-initialize on creation |
| `quickNavThreshold` | Number | `3` | Sensitivity for quick navigation |
| `rapidTabThreshold` | Number | `5` | Sensitivity for rapid tabbing |
| `rapidTabWindow` | Number | `3000` | Time window for rapid tabbing (ms) |
| `minAccessibilityFeatures` | Number | `2` | Min features needed for detection |

### Methods

#### `init()`
Initialize the detector and start listening for screen reader activity.

#### `isDisabledByUser()`
Returns `true` if user has previously disabled the built-in screen reader.
```javascript
if (detector.isDisabledByUser()) {
  myScreenReader.disable();
}
```

#### `disableBuiltInScreenReader()`
Manually disable the built-in screen reader and save preference.
```javascript
detector.disableBuiltInScreenReader();
```

#### `enableBuiltInScreenReader()`
Re-enable the built-in screen reader.
```javascript
detector.enableBuiltInScreenReader();
```

#### `isDetected()`
Returns `true` if screen reader has been detected.
```javascript
if (detector.isDetected()) {
  console.log('Screen reader is active');
}
```

#### `getState()`
Get the current internal state of the detector.
```javascript
const state = detector.getState();
console.log(state.detected, state.tabPressCount);
```

#### `destroy()`
Clean up and remove all event listeners.
```javascript
detector.destroy();
```

## Events

The detector dispatches custom events on `window`:

### `screenReaderDisabled`
Fired when the built-in screen reader is disabled.
```javascript
window.addEventListener('screenReaderDisabled', (e) => {
  console.log('Disabled by detector:', e.detail.detector);
  myScreenReader.disable();
});
```

### `screenReaderEnabled`
Fired when the built-in screen reader is re-enabled.
```javascript
window.addEventListener('screenReaderEnabled', (e) => {
  console.log('Enabled by detector:', e.detail.detector);
  myScreenReader.enable();
});
```

## Detection Methods

The library detects screen readers through multiple methods:

1. **Accessibility Features**: High contrast mode, forced colors, reduced motion
2. **Rapid Navigation**: Quick tabbing patterns
3. **ARIA Usage**: Frequent focus on ARIA-labeled elements
4. **Screen Reader Keys**: NVDA/JAWS specific key combinations (Insert, quick nav keys)
5. **Quick Navigation**: Single-key navigation (H for headings, K for links, etc.)

## Complete Example
```javascript
import ScreenReaderDetector from 'screen-reader-detector';

// Your built-in screen reader
const myScreenReader = {
  enabled: true,
  disable() {
    this.enabled = false;
    console.log('Built-in screen reader disabled');
  },
  enable() {
    this.enabled = true;
    console.log('Built-in screen reader enabled');
  }
};

// Initialize detector
const detector = new ScreenReaderDetector({
  onDetect: () => {
    console.log('External screen reader detected');
  }
});

// Check if user previously disabled it
if (detector.isDisabledByUser()) {
  myScreenReader.disable();
}

// Listen for disable event
window.addEventListener('screenReaderDisabled', () => {
  myScreenReader.disable();
});

// Listen for enable event
window.addEventListener('screenReaderEnabled', () => {
  myScreenReader.enable();
});

// Provide manual toggle button
document.getElementById('toggleButton').addEventListener('click', () => {
  if (detector.isDisabledByUser()) {
    detector.enableBuiltInScreenReader();
  } else {
    detector.disableBuiltInScreenReader();
  }
});
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ (with polyfills for `CustomEvent`)

## License



## Contributing

Contributions are welcome! Please open an issue or submit a pull request.