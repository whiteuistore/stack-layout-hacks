const sketch = require('sketch');

// Helper function to display native NSAlert for errors
function showNSAlert(title, message) {
  const alert = NSAlert.alloc().init();
  alert.messageText = title;
  alert.informativeText = message;
  alert.addButtonWithTitle("OK");
  alert.runModal();
}

// --- MAIN EXECUTION START ---

const doc = sketch.getSelectedDocument();

if (!doc) {
  showNSAlert("⚠️ Error", "No document is currently open.");
} else {
  const selection = doc.selectedLayers;

  // 1. Check if anything is selected
  if (selection.isEmpty) {
    showNSAlert("⚠️ Selection Required", "Please select at least one layer.");
  } else {
    
    let processedCount = 0;

    // 2. Process each selected layer individually
    selection.forEach(layer => {
      
      // Determine if the layer is already a container (Group, Frame, Artboard)
      const isContainer = layer.type === 'Group' || layer.type === 'Frame' || layer.type === 'SymbolMaster' || layer.type === 'Artboard';

      if (isContainer) {
        // CASE A: Layer is already a container. 
        // We just enable Horizontal Stack Layout and keep the original name.
        try {
          layer.stackLayout = {
            direction: 'horizontal',
            gap: 0,
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
          };
          processedCount++;
        } catch (e) {
          console.log(`Failed to enable stack on ${layer.name}: ${e}`);
        }

      } else {
        // CASE B: Layer is a leaf node (Text, Shape, etc.)
        // We wrap it in a new Group (which becomes a Frame once Stack is enabled).
        
        try {
          const parent = layer.parent;
          const originalFrame = layer.frame;
          const originalIndex = layer.index;

          // FIX: Use sketch.Group as the constructor (standard for all containers in JS API)
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

          // Move the new wrapper back to the original layer's position in the list
          newStackWrapper.index = originalIndex;

          // Reset internal coordinates of the child so it sits at (0,0) inside the wrapper
          layer.frame.x = 0;
          layer.frame.y = 0;

          // Enable Horizontal Stack Layout
          newStackWrapper.stackLayout = {
            direction: 'horizontal',
            gap: 0,
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
          };

          processedCount++;
        } catch (e) {
          console.log(`Failed to wrap layer ${layer.name}: ${e}`);
        }
      }
    });

    // 3. Final feedback via toast
    if (processedCount > 0) {
      // Clear selection to force an instant UI refresh in Sketch
      doc.selectedLayers.clear();
      sketch.UI.message(`✅ Successfully created ${processedCount} separate Horizontal Stack(s).`);
    } else {
      showNSAlert("⚠️ Processing Failed", "Could not create stacks for the selected layers.");
    }
  }
}