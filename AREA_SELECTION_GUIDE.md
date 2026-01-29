# Area Selection Recording - Multi-Display & Scaling Support

## Overview
The Screen Recorder now includes robust support for recording a selected area of your screen with proper handling for:
- **Multiple displays** (monitors)
- **Display scaling** (e.g., 125%, 150%, 200%)
- **Different display resolutions and positions**

## Features

### 1. Multi-Display Support
When you have multiple monitors connected:
- The app automatically detects all connected displays
- You can choose which monitor to draw the selection on
- Each display shows its resolution and whether it's the primary display
- Display scaling percentage is shown in the monitor selection dialog

### 2. Display Scaling Handling
The application properly handles Windows display scaling:
- **Automatic detection**: The app detects your display's scale factor (e.g., 125%, 150%, 200%)
- **Accurate coordinates**: Selection coordinates are correctly calculated regardless of scaling
- **Proper video cropping**: The recorded video matches exactly what you selected
- **Visual feedback**: The selection window shows detected scaling information

### 3. Selection Workflow

#### Step 1: Choose "Selection" Source
1. In the main window, select the "Selection" source (appears as the first option)
2. Click the "Draw Selection Area" button

#### Step 2: Select Display (Multi-Monitor Only)
- If you have **one monitor**: The selection overlay opens immediately
- If you have **multiple monitors**: A dialog appears listing all displays:
  - Monitor number (1, 2, 3, etc.)
  - Primary display indicator
  - Resolution (width × height)
  - Scaling percentage (if not 100%)

#### Step 3: Draw Selection Area
1. Click and drag to draw a rectangle on your screen
2. The selection box shows:
   - Live width × height dimensions
   - Corner handles for visual clarity
3. Press **Enter** or click **Confirm Selection** to accept
4. Press **Escape** or click **Cancel** to abort

#### Step 4: Start Recording
- The preview shows the selected region info with scaling details
- Click "Start Recording" to begin
- The video will only capture the area you selected

## Technical Details

### How Scaling is Handled

1. **Display Information Gathering**
   ```javascript
   // Each display provides:
   - id: Unique display identifier
   - bounds: Position and size in logical pixels
   - scaleFactor: e.g., 1.25 for 125% scaling
   - isPrimary: Whether this is the main display
   ```

2. **Coordinate Conversion**
   - Selection coordinates are captured in logical pixels (what you see)
   - Converted to physical pixels using the scale factor
   - Adjusted for multi-monitor positioning

3. **Video Cropping**
   - The video stream is captured at the physical resolution
   - Canvas cropping accounts for:
     - Display scale factor
     - Multi-monitor offset positions
     - Relative coordinates within the selected display

### Supported Configurations

✅ **Single monitor** (any resolution, any scaling)
✅ **Multiple monitors** with same scaling
✅ **Multiple monitors** with different scaling
✅ **Multiple monitors** in any arrangement (side-by-side, stacked, etc.)
✅ **High DPI displays** (4K, 5K, etc.)
✅ **Mixed resolution setups** (e.g., 1080p + 4K)

### Known Limitations

- Minimum selection size: 50×50 pixels (to ensure usable recordings)
- Selection must be within a single display (cannot span monitors)
- The selection overlay appears on one monitor at a time

## Troubleshooting

### Selection appears offset or incorrect size
- **Cause**: Display scaling settings changed during recording
- **Solution**: Restart the application to refresh display information

### Can't see selection window
- **Cause**: May appear on a different monitor
- **Solution**: Use the monitor selection dialog to choose the correct display

### Recording doesn't match selected area
- **Cause**: Rare scaling calculation issue
- **Solution**: 
  1. Check your Windows display scaling settings
  2. Restart the application
  3. Redraw the selection area

### Multiple monitors not detected
- **Cause**: Display configuration changed
- **Solution**: Restart the application to re-detect displays

## Example Use Cases

### Recording a specific application window
1. Select "Selection" source
2. Draw selection around the application window
3. Record only that window, ignoring everything else

### Recording gameplay at native resolution
1. Select the monitor with your game
2. Draw selection over the game area
3. Get perfect recording regardless of your desktop scaling

### Recording a portion of a 4K display on a scaled desktop
1. Works seamlessly with 150% or 200% scaling
2. Selection dimensions shown in logical pixels (easy to understand)
3. Final video maintains proper aspect ratio and quality

## API Reference

### Main Process (main.js)

```javascript
// Get all displays with scaling info
ipcMain.handle('get-displays', () => {
  // Returns array of display objects with:
  // - id, bounds, scaleFactor, isPrimary, etc.
});

// Open selection window on specific display
ipcMain.handle('open-selection-window', async (event, displayId) => {
  // Opens overlay on chosen display
  // Returns selection with absolute coordinates and scale factor
});
```

### Renderer Process (index.html)

```javascript
// Get display information
const displays = await window.electronAPI.getDisplays();

// Open selection overlay
const selection = await window.electronAPI.openSelectionWindow(displayId);
// Returns: { x, y, width, height, displayId, displayScaleFactor, ... }
```

## Recent Improvements

✨ **Enhanced scaling detection**: More accurate scale factor calculation
✨ **Better coordinate conversion**: Handles multi-monitor setups correctly
✨ **Visual scaling feedback**: Shows scaling info in selection overlay
✨ **Improved cropping algorithm**: Accounts for display positioning and scaling
✨ **Monitor info display**: Shows scaling percentage in monitor selection
✨ **Multi-display source matching**: Robust matching logic for correct screen source on each display
✨ **Smooth window closing**: Fade-out animation when closing selection overlay
✨ **Fixed keyboard handling**: Reliable Escape key and Enter key detection
✨ **Better focus management**: Selection overlay properly captures keyboard input

---

**Version**: 1.3.1+
**Last Updated**: January 2026
