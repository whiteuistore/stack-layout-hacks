const sketch = require('sketch');
const dom = require('sketch/dom');

// Load FlexSizing from the modern Sketch DOM (Sketch 100+)
// Added fallback integer values just in case the JS environment behaves unexpectedly
const FlexSizing = dom.FlexSizing || { Fixed: 0, Fit: 1, Fill: 2, Relative: 3 };

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

// Force the layout engine to recalculate boundaries after resizing
function applyLayout(layer) {
  try {
    const layout = layer.sketchObject.groupLayout();
    if (layout && layout.respondsToSelector(NSSelectorFromString("apply"))) {
      layout.apply();
    }
  } catch (e) {}
}

// Apply the width sizing property (horizontal sizing)
function setHorizontalSizing(layer, sizingValue) {
  // 1. Official modern JS API for Sketch 100+
  try {
    layer.horizontalSizing = sizingValue;
  } catch(e) {}

  // 2. Native Objective-C fallbacks for total reliability
  try {
    const nativeLayer = layer.sketchObject;
    if (nativeLayer.respondsToSelector(NSSelectorFromString("setLayoutSizingHorizontal:"))) {
      nativeLayer.setLayoutSizingHorizontal_(sizingValue);
    } else {
      nativeLayer.setValue_forKey_(NSNumber.numberWithInt_(sizingValue), "horizontalSizing");
    }
  } catch(e) {}
  
  applyLayout(layer);
}

// Recursive function to deeply traverse and process layers
function processLayerTree(layer, isRoot, stats) {
  if (isRoot) {
    // The parent Stack gets Fixed width
    setHorizontalSizing(layer, FlexSizing.Fixed);
  } else {
    // Children get Fill width ONLY if they are Groups/Frames AND have an active Stack Layout
    const validTypes = ['Group', 'Frame'];
    
    if (validTypes.includes(layer.type) && hasStackLayout(layer)) {
      setHorizontalSizing(layer, FlexSizing.Fill);
      stats.processedCount++;
    }
  }

  // Recursively dive into child layers (2-6+ levels deep)
  if (layer.layers && layer.layers.length > 0) {
    layer.layers.forEach(childLayer => {
      // Pass false for 'isRoot' so children correctly get the Fill behavior
      processLayerTree(childLayer, false, stats);
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
    let stats = { processedCount: 0 };

    selection.forEach(rootLayer => {
      // Added 'Frame' to the root layer check to support modern Sketch architecture
      const isContainer = rootLayer.type === 'Group' || rootLayer.type === 'Frame' || rootLayer.type === 'Artboard' || rootLayer.type === 'SymbolMaster';
      
      if (isContainer && hasStackLayout(rootLayer)) {
        validSelectionFound = true;
        
        // Start processing tree. 'true' indicates this is the root parent
        processLayerTree(rootLayer, true, stats);
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
      
      // Native non-blocking toast notification at the bottom of the Sketch window
      sketch.UI.message(`✅ Success: Parent set to Fixed. Width to Fill applied to ${stats.processedCount} nested Group(s).`);
    }
  }
}