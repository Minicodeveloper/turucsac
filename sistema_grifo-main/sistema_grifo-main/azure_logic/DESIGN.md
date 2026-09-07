# Design System Specification: Clinical Precision & Editorial Depth

## 1. Overview & Creative North Star: "The Architectural Ledger"
The objective of this design system is to transform the traditional, cluttered ERP experience into a high-end "Architectural Ledger." We move away from the "data-entry tool" aesthetic and toward a "curated executive dashboard." 

**The Creative North Star: Clinical Precision.**
This system breaks the generic "template" look by utilizing extreme white space, intentional asymmetry in data visualization, and a sophisticated layering of whites and grays. We replace rigid 1px borders with **Tonal Transitions**, creating a UI that feels like stacked sheets of premium bond paper rather than a digital grid.

---

## 2. Color & Surface Theory
We utilize a palette of "Active Neutrals" to guide the eye. The primary azure blue is used surgically—only to indicate action or focus—never for mere decoration.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** 
Structural boundaries must be defined solely through background color shifts. A `surface-container-low` (#F3F4F5) section sitting on a `surface` (#F8F9FA) background provides enough contrast for the human eye to perceive a boundary without the visual "noise" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of layers. Use the following hierarchy to define importance:
*   **Base Layer:** `surface-container-lowest` (#FFFFFF) - Reserved for the primary workspace.
*   **Layout Layer:** `surface` (#F8F9FA) - The main background canvas.
*   **Component Layer:** `surface-container` (#EDEEEF) - For cards and secondary navigation.
*   **Active Layer:** `primary_container` (#00AEEF) - Only for active states and high-priority linear accents.

### The "Glass & Gradient" Rule
To elevate the ERP above "standard" software, floating modals and navigation rails should utilize **Glassmorphism**. Apply a `surface` color at 80% opacity with a `24px` backdrop blur. For primary CTAs, use a subtle linear gradient from `primary` (#00658D) to `primary_container` (#00AEEF) at a 135-degree angle to add "soul" and depth.

---

## 3. Typography: Editorial Authority
We use **Inter** for its mathematical precision and neutral stance. The hierarchy is designed to feel like a high-end financial journal.

*   **Display & Headlines:** Use `on_secondary_fixed` (#0B1D2D) for maximum contrast. These should be set with tight letter-spacing (-0.02em) to feel authoritative.
*   **Titles:** All `title-lg` and `title-md` elements use the deep navy `on_secondary_fixed`. This anchors the page.
*   **Body & Labels:** Use `on_surface_variant` (#3E4850). This softer gray reduces eye strain during long-form data review.
*   **The "Micro-Tag" Logic:** Status tags (ACTUALIZADO, NUEVO) must use `label-sm` in all-caps with +0.05em tracking to ensure legibility at small scales.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are forbidden. We define depth through light and atmosphere.

*   **The Layering Principle:** Place a `surface-container-lowest` (#FFFFFF) card on a `surface-container-low` (#F3F4F5) section. This creates a "Natural Lift" that feels integrated into the architecture.
*   **Ambient Shadows:** For floating elements (e.g., dropdowns), use a shadow color tinted with the primary navy: `rgba(11, 29, 45, 0.06)` with a 32px blur and 16px Y-offset.
*   **The Ghost Border:** If a boundary is required for accessibility, use `outline_variant` (#BDC8D1) at **20% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons & Inputs
*   **Primary Action:** Gradient fill (Primary to Primary Container), `DEFAULT` (8px) radius. No border.
*   **Secondary/Tertiary:** `surface-container-highest` fill with `primary` (#00658D) text.
*   **Inputs:** High-contrast `surface-container-lowest` (#FFFFFF) background. On focus, the border transitions to a 1.5px `primary_container` (#00AEEF) glow.

### Cards & Lists: The "No-Divider" Mandate
**Never use horizontal divider lines.** 
*   Use `Spacing 8` (2rem) of vertical white space to separate list items. 
*   Alternatively, use alternating row backgrounds: `surface-container-lowest` and `surface-container-low`.

### Status Chips (Subtle Coding)
*   **ACTUALIZADO (Updated):** `secondary_container` (#D2E4FB) background / `on_secondary_container` text.
*   **NUEVO (New):** `tertiary_container` (#EA8C21) background / `on_tertiary_fixed_variant` text.
*   **PRONTO (Soon):** `surface_container_highest` background / `on_surface_variant` text.

### Linear Iconography
Icons must be 24px bounding boxes with a 1.5pt stroke weight. Use `primary_container` (#00AEEF) for all icons to create a "blue thread" that guides the user through the ERP workflow.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Align primary data to the left and secondary meta-data to the extreme right to create a "wide-screen" editorial feel.
*   **Embrace White Space:** If a section feels "empty," leave it. Do not fill space with unnecessary borders or containers.
*   **Optical Alignment:** Align icons optically rather than mathematically if they feel off-center within buttons.

### Don’t:
*   **Don't use 100% Black:** Use `on_surface` (#191C1D) for text to keep the interface feeling premium and soft.
*   **Don't use sharp corners:** Every element must adhere to the `DEFAULT` (0.5rem/8px) to `lg` (1rem/16px) scale to maintain a "human-centric" professional tone.
*   **Don't stack borders:** Never place a bordered input inside a bordered card. Use background color shifts instead.