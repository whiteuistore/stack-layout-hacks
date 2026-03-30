const sketch = require('sketch');

// Helper function to display native NSAlert for errors
function showNSAlert(title, message) {
  const alert = NSAlert.alloc().init();
  alert.messageText = title;
  alert.informativeText = message;
  alert.addButtonWithTitle("OK");
  alert.runModal();
}

// Check if a layer has an active Stack Layout (Sketch 100+)
function hasStackLayout(layer) {
  if (!layer || !layer.sketchObject) return false;
  
  const layout = layer.sketchObject.groupLayout();
  if (!layout) return false;

  // Safe check for Freeform layout using Objective-C class matching
  const isFreeform = layout.isKindOfClass_(NSClassFromString("MSFreeformGroupLayout"));
  return !isFreeform; 
}

// Safely extract a number using multiple possible keys (prioritizing the newest Sketch 100+ keys)
function extractNumber(nativeObj, keys, fallbackValue) {
  if (!nativeObj) return fallbackValue;
  for (let i = 0; i < keys.length; i++) {
    try {
      const val = nativeObj.valueForKey(keys[i]);
      if (val != null) {
        return Number(val);
      }
    } catch(e) {}
  }
  return fallbackValue;
}

// --- MAIN EXECUTION START ---

const doc = sketch.getSelectedDocument();

if (!doc) {
  showNSAlert("⚠️ Error", "No document is currently open.");
} else {
  const selection = doc.selectedLayers;

  if (selection.isEmpty) {
    showNSAlert(
      "⚠️ Selection Required", 
      "Please select a Group or Frame with an active Stack Layout to copy its properties."
    );
  } else {
    // We only take the FIRST selected layer as the master template
    const masterLayer = selection.layers[0];
    const isContainer = masterLayer.type === 'Group' || masterLayer.type === 'Artboard' || masterLayer.type === 'SymbolMaster';

    if (!isContainer || !hasStackLayout(masterLayer)) {
      showNSAlert(
        "❌ Invalid Template", 
        "The selected layer must be a Group or Frame with an active Stack Layout."
      );
    } else {
      
      const nativeLayer = masterLayer.sketchObject;
      const layout = nativeLayer.groupLayout();
      
      // Construct the explicit payload based on the required characteristics
      // NOTE: Fill and Outline/Border properties are strictly ignored.
      const clipboardPayload = {
        plugin: "StackLayoutHacks",
        type: "StackSettings",
        settings: {
          // Layer type context
          layerType: String(masterLayer.type),

          // 1. Stack direction
          axis: extractNumber(layout, ["flexDirection", "axis", "layoutDirection"], 0),
          
          // 2. Stack Wrap and Wrapping option (Using the newly discovered crossAxisGutterGap)
          isWrapEnabled: extractNumber(layout, ["wrappingEnabled", "isWrapEnabled", "wrap"], 0),
          wrapDirection: extractNumber(layout, ["wrapDirection"], 0),
          lineSpacing: extractNumber(layout, ["crossAxisGutterGap", "lineSpacing"], 0),
          
          // 3. Stack Distribution
          justifyContent: extractNumber(layout, ["justifyContent", "distribution"], 0),
          
          // 4. Stack spacing (Using the newly discovered allGuttersGap)
          spacing: extractNumber(layout, ["allGuttersGap", "spacing", "itemSpacing"], 0),
          
          // 5. Stack align
          alignItems: extractNumber(layout, ["alignItems", "alignment"], 0),
          
          // 6. Stack padding options and padding sizes (Using direct Layer properties)
          padding: {
            top: extractNumber(nativeLayer, ["topPadding"], 0),
            right: extractNumber(nativeLayer, ["rightPadding"], 0),
            bottom: extractNumber(nativeLayer, ["bottomPadding"], 0),
            left: extractNumber(nativeLayer, ["leftPadding"], 0)
          },
          
          // 7. Stack layout options (Width and Height Sizing)
          horizontalSizing: extractNumber(nativeLayer, ["horizontalSizing", "layoutSizingHorizontal"], 0),
          verticalSizing: extractNumber(nativeLayer, ["verticalSizing", "layoutSizingVertical"], 0),
          
          // 8. Enabled clip content or disabled
          clippingBehavior: extractNumber(nativeLayer, ["clippingBehavior"], 2),

          // 9. Corner Type (0 = Rounded, 1 = Smooth/Squircle)
          cornerType: extractNumber(nativeLayer, ["cornerStyle"], 0)
        }
      };

      // Send the explicit JSON to the macOS System Clipboard
      try {
        const pasteboard = NSPasteboard.generalPasteboard();
        pasteboard.clearContents();
        
        // Convert the JS object to a clean JSON string
        const payloadString = JSON.stringify(clipboardPayload, null, 2);
        pasteboard.setString_forType(payloadString, NSPasteboardTypeString);
        
        // Success Toast Notification
        sketch.UI.message(`📋 Stack properties copied successfully!`);
        
      } catch (error) {
        showNSAlert("⚠️ Clipboard Error", "Could not write to the system clipboard.");
      }
    }
  }
}
