const sketch = require('sketch');

// Helper function to display native NSAlert for errors
function showNSAlert(title, message) {
  const alert = NSAlert.alloc().init();
  alert.messageText = title;
  alert.informativeText = message;
  alert.addButtonWithTitle("OK");
  alert.runModal();
}

// Safely apply primitive values to the native layout object via KVC
function applyNativeSetting(nativeObj, keys, value) {
  if (!nativeObj || value === undefined || value === null) return;
  for (let i = 0; i < keys.length; i++) {
    try {
      nativeObj.setValue_forKey_(Number(value), keys[i]);
      return; 
    } catch(e) {}
  }
}

// --- MAIN EXECUTION START ---

const doc = sketch.getSelectedDocument();

if (!doc) {
  showNSAlert("⚠️ Error", "No document is currently open.");
} else {
  const selection = doc.selectedLayers;

  // 1. Check if anything is selected
  if (selection.isEmpty) {
    showNSAlert("⚠️ Selection Required", "Please select at least one layer to wrap into a Vertical Stack.");
  } else {
    
    let processedCount = 0;

    // 2. Process each selected layer individually
    selection.forEach(layer => {
      
      const isContainer = layer.type === 'Group' || layer.type === 'Frame' || layer.type === 'SymbolMaster' || layer.type === 'Artboard';

      if (isContainer) {
        // CASE A: Layer is already a container.
        try {
          // Initialize via JS API
          layer.stackLayout = { direction: 'vertical', wraps: false };

          // Force exact Native Keys for VERTICAL orientation
          const nativeLayout = layer.sketchObject.groupLayout();
          if (nativeLayout) {
            applyNativeSetting(nativeLayout, ["flexDirection"], 1); // Vertical
            applyNativeSetting(nativeLayout, ["wrappingEnabled"], 0); // Off
            applyNativeSetting(nativeLayout, ["axis"], 0); // As per your research
            applyNativeSetting(nativeLayout, ["crossAxisGutterGap"], 0);
          }
          processedCount++;
        } catch (e) {
          console.log(`Failed to enable vertical stack on ${layer.name}: ${e}`);
        }

      } else {
        // CASE B: Layer is a leaf node (Text, Shape, etc.)
        try {
          const parent = layer.parent;
          const originalFrame = layer.frame;
          const originalIndex = layer.index;

          // Wrap in a new Group (Frame)
          const newStackWrapper = new sketch.Group({
            name: "Stack",
            parent: parent,
            frame: {
              x: originalFrame.x,
              y: originalFrame.y,
              width: originalFrame.width,
              height: originalFrame.height
            },
            layers: [layer]
          });

          newStackWrapper.index = originalIndex;
          layer.frame.x = 0;
          layer.frame.y = 0;

          // Initialize via JS API
          newStackWrapper.stackLayout = { direction: 'vertical', wraps: false };

          // Force exact Native Keys for VERTICAL orientation
          const nativeLayout = newStackWrapper.sketchObject.groupLayout();
          if (nativeLayout) {
            applyNativeSetting(nativeLayout, ["flexDirection"], 1); // Vertical
            applyNativeSetting(nativeLayout, ["wrappingEnabled"], 0); // Off
            applyNativeSetting(nativeLayout, ["axis"], 0); // As per your research
            applyNativeSetting(nativeLayout, ["crossAxisGutterGap"], 0);
          }

          processedCount++;
        } catch (e) {
          console.log(`Failed to wrap layer ${layer.name} into Vertical Stack: ${e}`);
        }
      }
    });

    // 3. Final feedback via toast
    if (processedCount > 0) {
      doc.selectedLayers.clear();
      sketch.UI.message(`✅ Successfully created ${processedCount} separate Vertical Stack(s)`);
    } else {
      showNSAlert("⚠️ Processing Failed", "Could not create vertical stacks for the selected layers.");
    }
  }
}
