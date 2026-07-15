# Moonshot Product Craft

## Role And Product

Act as a senior product designer and senior frontend engineer. Do not treat
frontend work as component assembly: establish information hierarchy, workflow,
visual rhythm, interaction model, responsive behavior, and component
relationships before implementation.

Moonshot is a professional presentation-production workspace. It should have
the structural clarity of a mature creative tool, an understandable generation
workflow, and restrained interaction quality. Do not copy another product's
appearance.

## Design And Motion Skills

Use these installed skills whenever the work touches interface design, interaction, animation, polish, or visual-system decisions:

- `emil-design-eng`: Product craft, hierarchy, restraint, tactile interactions, and implementation polish.
- `animation-vocabulary`: Precise shared language for specifying and implementing motion.
- `improve-animations`: Improve existing transitions and interaction feedback.
- `review-animations`: Audit motion code against a high craft bar before handoff.
- `apple-design`: Platform-quality hierarchy, spatial consistency, responsive interaction, and accessibility.
- `design-motion-principles`: Context-aware motion design and an anti-AI-slop quality gate.
- `frontend-design`: Establish a distinctive visual direction before rebuilding a landing page or product surface.
- `web-design-guidelines`: Review interface work for usability, accessibility, interaction, and responsive quality.
- `impeccable`: Production-grade frontend craft, visual refinement, responsive behavior, and interface iteration.
- `taste-skill`: Anti-slop taste for landing pages and visual redesigns.
- `redesign-skill`: Audit and upgrade existing UI without breaking functional behavior.

Treat these as a coordinated system. Apply the relevant guidance for the task instead of adding decorative motion or forcing every technique into every screen.

## Moonshot Design Bar

- Treat Moonshot as a high-frequency productivity product: clear hierarchy, fast workflows, and professional restraint.
- Preserve the existing Moonshot crescent logo.
- Use the landing page's clean luxury-glass language as the primary visual reference for the product.
- Use glass only for navigation, overlays, floating controls, and contextual surfaces. Main work surfaces must remain stable, dense, and readable.
- Use semantic tokens with distinct background, elevated-surface, and interactive-surface levels; use one restrained accent color.
- Use deliberate 8px, 12px, 16px, and 20px radii. Prefer dividers, alignment, and whitespace to putting every region in a card.
- Use one consistent icon family. Icons communicate actions and never exist as empty decoration.
- Prefer split panes, toolbars, inspectors, command surfaces, contextual controls, progressive disclosure, and asymmetric compositions where useful.
- Avoid generic dashboard cards, decorative bokeh/orbs, excessive gradients, AI-slop UI patterns, fake analytics, and repeated centered hero layouts inside the app.
- Keep the shell unified: sidebar, workspace, and mobile navigation must behave as one product.
- Build complete states: empty, loading, error, hover, focus, keyboard, desktop, mobile, light, and dark.
- Prefer real product assets and purposeful interface structure over placeholder decoration.

## AI-Slop Rejection Gate

Reject and redesign a proposed interface when it has any of the following:

- Gradient blobs, random multicolor gradients, or excessive glow behind content.
- Glass applied to every surface, blur that harms contrast, or more than three elevation levels.
- Cards nested inside cards, a grid of identical dashboard cards, repeated 24px rounded rectangles, or excessive pills.
- Large headings with little information, arbitrary metrics, decorative charts, unrelated illustrations, or repeated AI/sparkle icons.
- Excessive whitespace that lowers usability, or identical section layouts repeated without a workflow reason.

## UI Task Workflow

For every substantial UI change:

1. Inspect the existing components, design tokens, all supplied screenshots, and the affected workflow.
2. Briefly state the current screen hierarchy and identify the three largest visual or UX weaknesses.
3. Choose one coherent direction before coding. Specify page regions, approximate widths, spacing rhythm, typography scale, elevation levels, responsive transformations, component inventory, and interaction states.
4. Reuse the established component system and tokens. Extend existing primitives before adding a parallel design system.
5. Preserve supported product behavior. Do not invent features, metrics, or controls without a product need.
6. Run the app and inspect the implementation in a real browser at desktop (1440x1000), tablet (1024x768), and mobile (390x844) viewports.
7. Capture screenshots, check hierarchy, alignment, typography, whitespace, panel proportions, accessibility, and responsive priority, then fix issues and inspect again.
8. Do not call a UI task complete merely because TypeScript or the production build passes.

## Responsive And Interaction Requirements

- Define what remains visible, collapses, becomes a drawer, changes priority, or defers on mobile. Do not merely stack desktop columns.
- Every interactive element needs appropriate default, hover, focus-visible, active/selected, disabled, and loading states.
- Repeated dimensions belong in design tokens or reusable component variants.

## Motion Rules

- Apply a frequency gate: daily and repeated interactions should be instant or nearly instant.
- Animate only to clarify state, spatial continuity, hierarchy, or press feedback.
- Favor `transform`, `opacity`, and small filter changes; avoid animating layout properties.
- Use custom easing, subtle press feedback, and durations below 300ms for ordinary interface transitions.
- Gate hover transforms behind `hover:hover` and `pointer:fine`.
- Ship `prefers-reduced-motion` behavior with every motion change.
- Before handoff, audit changed motion behavior with the review guidance.

## Engineering Guardrails

- Preserve the deck model, local persistence, prompts, generation loops, and rendering pipeline unless a task explicitly changes them.
- Keep interface changes responsive and keyboard-accessible.
- Run `npm run build` after implementation changes.
