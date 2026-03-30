const sketch = require('sketch');

// Helper function to display native NSAlert (for errors and warnings)
function showNSAlert(title, message) {
  const alert = NSAlert.alloc().init();
  alert.messageText = title;
  alert.informativeText = message;
  alert.addButtonWithTitle("OK");
  alert.runModal();
}

// Check if a layer has an active Stack Layout
function hasStackLayout(layer) {
  if (!layer || !layer.sketchObject) return false;
  
  const layout = layer.sketchObject.groupLayout();
  if (!layout) return false;

  const className = String(layout.class());
  if (className.includes("Freeform")) return false;
  return className.includes("Layout");
}

// Enable Clip Content using strictly clippingBehavior
function enableClipContent(layer) {
  const nativeLayer = layer.sketchObject;

  // THE SECRET KEY: Restrict the mask to group children only (clippingBehavior: 1)
  try {
    if (nativeLayer.respondsToSelector(NSSelectorFromString("setClippingBehavior:"))) {
      nativeLayer.setClippingBehavior_(1);
    } else {
      nativeLayer.setValue_forKey_(NSNumber.numberWithInt_(1), "clippingBehavior");
    }
  } catch(e) {
    console.log("Failed to set clippingBehavior");
  }

  // Apply the supporting properties safely
  try {
    nativeLayer.setValue_forKey_(NSNumber.numberWithBool_(false), "shouldBreakMaskChain");
    nativeLayer.setValue_forKey_(NSNumber.numberWithInt_(0), "clippingMaskMode");
  } catch(e) {}
}

// Recursive function to deeply traverse and process layers
function processLayerTree(layer, stats) {
  const isValidContainer = layer.type === 'Group' || layer.type === 'Artboard' || layer.type === 'SymbolMaster';

  if (isValidContainer && hasStackLayout(layer)) {
    enableClipContent(layer);
    stats.clippedCount++;
  }

  // Recursively dive into child layers
  if (layer.layers && layer.layers.length > 0) {
    layer.layers.forEach(childLayer => {
      processLayerTree(childLayer, stats);
    });
  }
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
      "Please select a Group or Frame with Stack Layout."
    );
  } else {
    let validSelectionFound = false;
    let stats = { clippedCount: 0 };

    selection.forEach(rootLayer => {
      const isContainer = rootLayer.type === 'Group' || rootLayer.type === 'Artboard' || rootLayer.type === 'SymbolMaster';
      
      if (isContainer && hasStackLayout(rootLayer)) {
        validSelectionFound = true;
        processLayerTree(rootLayer, stats);
      }
    });

    if (!validSelectionFound) {
      showNSAlert(
        "❌ Invalid Selection", 
        "The selected layer must be a Group or Frame with an active Stack Layout."
      );
    } else {
      
      // Clear selection to force the Inspector UI to refresh upon re-selection
      doc.selectedLayers.clear();
      
      // Changed to a native non-blocking toast notification at the bottom of the Sketch window
      sketch.UI.message(`✅ Success: Clip Content applied to ${stats.clippedCount} Stack(s).`);
    }
  }
}
