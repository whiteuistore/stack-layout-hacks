const sketch = require('sketch');

// Helper function to display native NSAlert for errors
function showNSAlert(title, message) {
  const alert = NSAlert.alloc().init();
  alert.messageText = title;
  alert.informativeText = message;
  alert.addButtonWithTitle("OK");
  alert.runModal();
}

// Safely apply primitive values to the native layer using KVC
function applySetting(nativeObj, keys, value) {
  if (!nativeObj || value === undefined || value === null) return;
  for (let i = 0; i < keys.length; i++) {
    try {
      nativeObj.setValue_forKey_(Number(value), keys[i]);
      // We don't return here because we want to try ALL matching keys 
      // in the latest Sketch engine to be 100% sure.
    } catch(e) {}
  }
}

// --- MAIN EXECUTION START ---

const doc = sketch.getSelectedDocument();

if (!doc) {
  showNSAlert("⚠️ Error", "No document is currently open.");
} else {
  const selection = doc.selectedLayers;

  if (selection.isEmpty) {
    showNSAlert("⚠️ Selection Required", "Please select at least one layer.");
  } else {
    
    const pasteboard = NSPasteboard.generalPasteboard();
    const clipboardString = pasteboard.stringForType(NSPasteboardTypeString);
    
    if (!clipboardString) {
      showNSAlert("❌ Empty Clipboard", "Clipboard is empty.");
    } else {
      
      let payload = null;
      try { payload = JSON.parse(String(clipboardString)); } catch(e) {}

      if (!payload || payload.plugin !== "StackLayoutHacks") {
        showNSAlert("❌ Invalid Data", "Not a valid StackLayoutHacks payload.");
      } else {
        
        const settings = payload.settings;
        let processedCount = 0;

        selection.forEach(layer => {
          const isContainer = layer.type === 'Group' || layer.type === 'Artboard' || layer.type === 'SymbolMaster' || layer.type === 'Frame';
          
          if (isContainer) {
            const nativeLayer = layer.sketchObject;

            // 1. Initialize Stack via JS API
            try {
              layer.layout = { type: 'Stack' };
              layer.stackLayout = {
                direction: settings.axis === 1 ? 'vertical' : 'horizontal',
                wraps: settings.isWrapEnabled === 1
              };
            } catch(e) {}

            // 2. Apply Core Layout Settings (MSFlexGroupLayout)
            const layout = nativeLayer.groupLayout();
            if (layout) {
              applySetting(layout, ["flexDirection"], settings.axis);
              applySetting(layout, ["wrappingEnabled"], settings.isWrapEnabled);
              applySetting(layout, ["allGuttersGap", "spacing"], settings.spacing);
              applySetting(layout, ["crossAxisGutterGap", "lineSpacing"], settings.lineSpacing);
              applySetting(layout, ["justifyContent", "distribution"], settings.justifyContent);
              applySetting(layout, ["alignItems", "alignment"], settings.alignItems);
            }

            // 3. APPLY PADDING (The "Athens" Fix)
            if (settings.padding) {
              // UNLOCK: Force paddingSelection to 2 (Individual mode)
              // This is the key to making topPadding and bottomPadding work independently!
              applySetting(nativeLayer, ["paddingSelection"], 2);

              // APPLY: Inject individual values
              applySetting(nativeLayer, ["topPadding"], settings.padding.top);
              applySetting(nativeLayer, ["rightPadding"], settings.padding.right);
              applySetting(nativeLayer, ["bottomPadding"], settings.padding.bottom);
              applySetting(nativeLayer, ["leftPadding"], settings.padding.left);
            }

            // 4. Sizing, Corners & Clipping
            applySetting(nativeLayer, ["horizontalSizing", "layoutSizingHorizontal"], settings.horizontalSizing);
            applySetting(nativeLayer, ["verticalSizing", "layoutSizingVertical"], settings.verticalSizing);
            applySetting(nativeLayer, ["cornerStyle"], settings.cornerType);

            const shouldClip = (settings.clippingBehavior !== 2);
            try { layer.clipsContent = shouldClip; } catch(e) {}
            try { nativeLayer.setHasClippingMask_(shouldClip); } catch(e) {}
            
            // Refresh UI and Layout
            if (nativeLayer.respondsToSelector(NSSelectorFromString("objectDidUpdate"))) {
              nativeLayer.objectDidUpdate();
            }
            if (layout && layout.respondsToSelector(NSSelectorFromString("apply"))) {
              layout.apply();
            }
            
            processedCount++;
          }
        });

        if (processedCount > 0) {
          doc.selectedLayers.clear();
          sketch.UI.message(`✅ Applied Stack & Padding (${processedCount} layers) using MSFlexGroupLayout keys.`);
        }
      }
    }
  }
}