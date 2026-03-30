# Stack Layout Hacks for Sketch

<img src="https://github.com/whiteuistore/stack-layout-hacks/blob/a4c2d0a82e85d7f5f02df32e330250fc61564e1f/assets/banner.png" alt="Stack Layout Hacks for Sketch">

**Stack Layout Hacks** is a powerful productivity plugin for Sketch (Athens release and newer) designed to bridge the gaps in the native Stack Layout implementation. It provides advanced controls for bulk-managing stack properties, deep-toggling clipping behavior, and streamlining design system workflows.

---

## 🚀 Key Features

### 📋 Property Management
- **Copy & Paste Stack Properties**: Copy full stack configurations (direction, spacing, wrapping, padding, sizing, and corner styles) from one layer and apply them to multiple targets.
- **Deep Padding Control**: Forces individual padding mode (`paddingSelection: 2`) to ensure asymmetric values (e.g., Top: 6, Bottom: 0) are applied correctly.

### ✂️ Clip Content Controls
- **Bulk Enable/Disable Clip Content**: Deeply traverse layer trees to enable or disable the "Clip Content" property on all nested Stacks within a selection.
- **Smart Logic**: Uses native `clippingBehavior` keys to ensure UI consistency in the Sketch Inspector.

### 📐 One-Click Sizing Presets
Quickly set Horizontal or Vertical sizing for parents and all nested children:
- **Width**: Set to **Fill** (children), **Fit**, or **Fixed**.
- **Height**: Set to **Relative**, **Fit**, or **Fixed**.

### 📦 Quick Stack Creation
- **Separate Horizontal Stacks**: Wrap each selected object (Text, Shape, Group, or Frame) into its own individual Horizontal Stack wrapper.
- **Separate Vertical Stacks**: Wrap objects into individual Vertical Stacks using native `flexDirection` and `axis` parameters for 100% accuracy.

---

## 🚀 How it works?

### Copy/Paste stack layout properties

<p align="center">
  <video src="https://github.com/user-attachments/assets/8e54da99-c6e8-429b-83d0-306474eddec8" width="100%" controls>
  </video>
</p>

### Set the height of all elements inside the stack to Fit

<p align="center">
  <video src="https://github.com/user-attachments/assets/654cf6c7-45d0-484e-926c-edf292679456" width="100%" controls>
  </video>
</p>

### Create independent horizontal/vertical stacks

<p align="center">
  <video src="https://github.com/user-attachments/assets/67a5138c-92e1-40d1-bd31-79122f9996fe" width="100%" controls>
  </video>
</p>

### Set the width of all elements inside the stack to Fill

<p align="center">
  <video src="https://github.com/user-attachments/assets/e905a0cd-1fba-4b3c-b87e-89d40b6e4f23" width="100%" controls>
  </video>
</p>


### Enable/disable stack clipping

<p align="center">
  <video src="https://github.com/user-attachments/assets/5ebde6eb-1195-4b7e-a0ec-cf734419e4a2" width="100%" controls>
  </video>
</p>


---

## 🛠 Installation

1.  [Download the latest release](https://github.com/whiteuistore/stack-layout-hacks/releases) of the plugin.
2.  Double-click `stack-layout-hacks.sketchplugin` to install.

---

## 📖 How to Use

### Copy & Paste Properties
1. Select a Frame or Group with an active Stack Layout.
2. Run `Plugins -> Stack Layout Hacks -> Copy Stack Properties`.
3. Select one or more target layers.
4. Run `Plugins -> Stack Layout Hacks -> Paste Stack Properties`.

### Managing Clip Content
Select a top-level container and run `Enable Clip Content` or `Disable Clip Content`. The plugin will recursively find all nested Stacks and update their clipping behavior.

### Individual Wrapping
Select multiple layers (e.g., several icons or text fields) and run `Create Separate Vertical Stacks`. Each layer will be wrapped in a new Frame named "Stack" with the vertical layout enabled.

---

## ⚙️ Requirements
- **Sketch 100+** (Athens Release) is highly recommended for full compatibility with modern `MSFlexGroupLayout` and `Frame` objects.

---

## 💎 Support the Project

If you find this plugin helpful, consider supporting its development:
- **Visit our store:** [WhiteUI.Store](https://www.whiteui.store/)
- **Donate:** [Buy Me a Coffee](https://buymeacoffee.com/whiteuistore)

---

## 📜 Author
Created by **WhiteUI.Store**. Reach out for feedback or custom plugin development.

---

## License
MIT © WhiteUI.Store
