# Design System Document: High-End Athletic Editorial

## 1. Overview & Creative North Star: "The Kinetic Monument"
This design system is built to evoke the prestige of ivy-league tradition fused with the aggressive momentum of modern elite athletics. Our Creative North Star is **"The Kinetic Monument."** 

Unlike standard sports apps that rely on cluttered grids and frantic animations, this system treats digital space like a high-end fashion editorial or a luxury stadium program. We break the "template" look through **intentional asymmetry**, where large-scale typography bleeds off-canvas, and **tonal layering**, where depth is felt rather than seen. We prioritize breathing room and high-contrast silver accents to ensure every screen feels like a curated event rather than a data table.

## 2. Colors & Surface Architecture
The palette is rooted in a deep, nocturnal foundation, allowing the metallic golds and royal blues to "glow" with intentionality.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background color shifts or subtle tonal transitions. Use `surface-container-low` sections against a `background` floor to create invisible yet felt divisions.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of carbon fiber and frosted glass.
*   **Base:** `background` (#121416) is your ground floor.
*   **Layer 1:** Use `surface-container-low` for large content blocks.
*   **Layer 2:** Use `surface-container` or `surface-container-high` for nested cards or interactive modules.
*   **The Glass & Gradient Rule:** For main CTAs and Hero sections, use a **Metallic Sweep**: a linear gradient transitioning from `primary` (#b3c5ff) to `primary_container` (#002366) at a 135-degree angle. This provides a "soul" and professional polish that flat color cannot replicate.

## 3. Typography: Impact & Precision
We utilize a dual-font strategy to balance aggressive athletic energy with elite editorial readability.

*   **Display & Headlines (Lexend):** Used exclusively in **Bold, Italic, and Uppercase** for high-impact moments. Lexend’s geometric clarity provides an "engineered" feel.
    *   *Display-LG (3.5rem):* For scoreboards and hero titles.
    *   *Headline-MD (1.75rem):* For section headers.
*   **Body & Utility (Inter):** Used for all long-form text and titles to ensure high legibility against dark surfaces.
    *   *Body-MD (0.875rem):* Standard reading text.
    *   *Label-MD (0.75rem, Lexend):* Used for metadata, always tracked out (+5%) for a premium feel.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often too "muddy" for a high-contrast athletic brand. We achieve depth through light and material logic.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This "recessed" look creates a sophisticated, architectural depth.
*   **Ambient Shadows:** When an element must float (e.g., a bottom sheet), use an extra-diffused shadow: `blur: 40px`, `opacity: 6%`, using a tinted version of `primary` rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline_variant` at **15% opacity**. Never use 100% opaque lines.
*   **Glassmorphism:** For overlays and navigation bars, use `surface` at 70% opacity with a `backdrop-filter: blur(20px)`. This integrates the UI into the background, preventing a "pasted on" appearance.

## 5. Components & Interaction

### Buttons (The Kinetic Trigger)
*   **Primary:** A metallic gradient (Royal Blue to Deep Blue). Lexend Bold Italic Uppercase text. 
*   **Secondary:** `secondary` (#e9c349) solid fill with `on_secondary` text. Reserved for "Gold Medal" actions (e.g., Buy Tickets, View Finals).
*   **Tertiary:** No fill. `outline` text with a subtle `surface_bright` hover state.
*   **Shape:** Use the `DEFAULT` (0.25rem) radius for a sharp, aggressive "pro-sport" look. Avoid `full` rounding except for notification badges.

### Cards & Lists (The Editorial Feed)
*   **No Dividers:** Forbid the use of divider lines. Separate list items using `8px` of vertical white space or alternating `surface-container-low` and `surface-container-lowest` backgrounds.
*   **Asymmetric Imagery:** Images within cards should use a slight 2-degree shear or bleed to the edge of the container to break the "boxed" feel.

### Selection Elements
*   **Chips:** Use `tertiary_container` for unselected states. Upon selection, transition to a `secondary` (Gold) fill with a subtle "inner glow" (1px blur shadow).
*   **Input Fields:** Ghost-style inputs. No bottom line. Use a `surface-container-highest` background with `label-sm` floating above.

### Contextual Components
*   **The "Live-Stripe":** A thin, high-contrast silver/steel (`tertiary`) bar that runs vertically alongside "Live" content to indicate active energy.
*   **Medal Badges:** Minimalist circular containers using `secondary` (Gold), `tertiary` (Silver), and `primary_container` (Bronze/Blue) to denote standings.

## 6. Do’s and Don’ts

### Do:
*   **Do** use extreme scale. Pair a `display-lg` headline with a `label-sm` sub-headline for an editorial look.
*   **Do** use "Silver Accents." Use the `tertiary` token for iconography and small decorative lines to cut through the dark theme.
*   **Do** lean into italics. Lexend Italic is the "speed" of the brand.

### Don't:
*   **Don't** use pure black (#000000). Always use `surface_dim` or `background` to maintain tonal depth.
*   **Don't** use standard "Success" green. Use the `secondary` (Gold) or `primary` (Royal Blue) for all positive reinforcements to maintain the brand's specific color story.
*   **Don't** center-align everything. Use left-aligned "staircase" layouts to create a sense of forward motion.