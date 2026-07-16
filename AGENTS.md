# Moonshot Product Craft

## Role And Product

Act as a senior product designer and senior frontend engineer. Treat interface
work as product design, not component assembly. Establish information
hierarchy, workflow, visual rhythm, interaction model, responsive behavior,
and component relationships before implementation.

Moonshot is a professional presentation-production workspace. It should have
the structural clarity of a mature creative tool, an understandable generation
workflow, and restrained interaction quality. Do not copy another product's
appearance.

## Automatic Skill Router

For any substantial UI, visual, interaction, animation, Figma, or responsive
task, inspect the installed skills and load the smallest relevant set before
editing. Never load every design skill at once. Overlapping style skills create
conflicting rules and generic compromise.

Use this order:

1. Choose one primary design skill.
2. Add one specialist for motion, platform, visual reference, or Figma when the
   task needs it.
3. Implement with the existing Moonshot component and token system.
4. Add the matching audit/review skill.
5. Verify in a real browser at desktop, tablet, and mobile widths.

### Primary Design Skills

- New product UI or major new surface: `frontend-design` plus `impeccable`.
- Existing UI redesign: `redesign-existing-projects` plus `impeccable`.
- Distinctive landing page, portfolio, or expressive marketing surface:
  `design-taste-frontend`.
- High-frequency professional app UI and detailed polish: `emil-design-eng`.
- Broad style, palette, typography, and stack exploration: `ui-ux-pro-max`.
- Full art-direction and implementation pipeline: `paint`.
- Use `design-taste-frontend-v1` only for explicit backward compatibility.

Do not combine more than two primary design skills unless the user explicitly
requests a comparative exploration.

### Style Direction Skills

Use only when the requested direction fits:

- `minimalist-ui`: editorial minimalism and quiet monochrome systems.
- `industrial-brutalist-ui`: mechanical, Swiss, terminal, or raw data-heavy UI.
- `high-end-visual-design`: premium agency styling and refined surfaces.
- `gpt-taste`: highly expressive GSAP-led editorial pages.
- `brandkit`: identity systems and brand-guideline visual boards.
- `canvas-generative`: generative Canvas 2D visuals.
- `compose-graphics`: advanced Android/Compose graphics.
- `swiftui-graphics`: advanced Apple/SwiftUI graphics.
- `threejs-r3f`: real-time 3D scenes and shaders.

Style skills are directions, not decoration licenses. Preserve product
hierarchy, accessibility, and workflow density.

### Motion Skills

- Name an unknown motion pattern: `animation-vocabulary`.
- Find places where motion would clarify the UI: `find-animation-opportunities`.
- Plan improvements to existing motion: `improve-animations`.
- Review changed motion before handoff: `review-animations`.
- Build or audit interaction motion: `design-motion-principles`.
- Motion foundations and timing: `motion-principles`.
- Native browser motion: `css-native`.
- React Motion implementation: `framer-motion`.
- Timeline and ScrollTrigger work: `gsap`.
- Multi-platform motion composition: `compose-motion`, `swiftui-motion`, or
  `compose-multiplatform` as appropriate.
- Creative micro-interactions and a focused wow moment: `cast`.

Use `find-animation-opportunities` and `improve-animations` as read-only audits.
Use an implementation skill afterward when code changes are requested.

### Platform Skills

- Apple-like interaction, gesture, and material decisions: `apple-design`.
- Desktop keyboard, pointer, focus, and multi-window behavior:
  `desktop-principles`.
- Mobile touch, safe-area, thumb-zone, and performance behavior:
  `mobile-principles`.
- Cross-platform Compose behavior: `compose-multiplatform`.

### Visual Reference Skills

- Generate one visual reference per web section: `imagegen-frontend-web`.
- Generate coherent mobile screen flows: `imagegen-frontend-mobile`.
- Generate a reference, analyze it, then implement it: `image-to-code`.
- Convert a direction into a Stitch-ready design specification:
  `stitch-design-taste`.
- Use `full-output-enforcement` only when a task explicitly requires exhaustive,
  unabridged output.

Visual-reference skills generate direction, not product truth. The final UI
must use real Moonshot data, workflows, and assets.

### Figma Skills

- General Figma context and design-to-code reads: `figma`.
- Any Figma canvas write or unique scripted read: invoke `figma-use` first.
- Build a new Figma file: `figma-create-new-file`.
- Generate a page or screen in Figma: `figma-generate-design` with `figma-use`.
- Build a Figma design-system library: `figma-generate-library` with
  `figma-use`.
- Implement a supplied Figma design in code: `figma-implement-design`.
- Connect Figma and code components: `figma-code-connect-components`.
- Derive project-specific Figma implementation rules:
  `figma-create-design-system-rules`.

### Audit And Browser Skills

- Full design-system and responsive audit: `design-audit`.
- Web usability and accessibility review: `web-design-guidelines`.
- Production polish, hardening, and UX critique: `impeccable`.
- Browser automation and screenshots: `playwright`.
- Persistent iterative browser inspection: `playwright-interactive`.
- OS-level screenshot capture only when browser capture is unavailable:
  `screenshot`.

For a substantial UI change, finish with one design audit and one browser
verification skill. Do not call the work complete because TypeScript builds.

### Caveman Skill

`caveman` is installed for terse, low-narration sessions. Activate it only when
the user explicitly asks for Caveman style, compressed answers, or minimal
output. Do not auto-activate it for design critique, UX explanation, safety
warnings, or ambiguous multi-step work where brevity would reduce clarity.

## Moonshot Design Bar

- Treat Moonshot as a high-frequency productivity product: clear hierarchy,
  fast workflows, and professional restraint.
- Preserve the Moonshot crescent logo.
- Use the landing page's clean luxury-glass language as a brand reference, not
  as a reason to blur every product surface.
- Use glass for navigation, overlays, floating controls, and contextual
  surfaces. Main work surfaces remain stable, dense, and readable.
- Use semantic tokens with distinct background, elevated-surface, and
  interactive-surface levels and one restrained accent color.
- Use deliberate 8px, 12px, 16px, and 20px radii. Prefer dividers, alignment,
  and whitespace to putting every region in a card.
- Use one consistent icon family. Icons communicate actions and never exist as
  empty decoration.
- Prefer split panes, toolbars, inspectors, command surfaces, contextual
  controls, progressive disclosure, and asymmetric compositions where useful.
- Avoid generic dashboard cards, decorative bokeh, excessive gradients,
  AI-slop UI patterns, fake analytics, and repeated centered hero layouts inside
  the app.
- Keep the shell unified: sidebar, workspace, and mobile navigation behave as
  one product.
- Build complete states: empty, loading, error, hover, focus, keyboard,
  desktop, mobile, light, and dark.
- Prefer real product assets and purposeful interface structure over
  placeholder decoration.

## AI-Slop Rejection Gate

Reject and redesign a proposed interface when it has any of the following:

- Gradient blobs, random multicolor gradients, or excessive glow behind
  content.
- Glass applied to every surface, blur that harms contrast, or more than three
  elevation levels.
- Cards nested inside cards, a grid of identical dashboard cards, repeated 24px
  rounded rectangles, or excessive pills.
- Large headings with little information, arbitrary metrics, decorative charts,
  unrelated illustrations, or repeated AI and sparkle icons.
- Excessive whitespace that lowers usability or identical section layouts
  repeated without a workflow reason.

## UI Task Workflow

For every substantial UI change:

1. Inspect existing components, design tokens, supplied references, and the
   affected workflow.
2. State the current screen hierarchy and the three largest visual or UX
   weaknesses.
3. Choose one coherent direction before coding. Define page regions,
   approximate widths, spacing rhythm, typography scale, elevation levels,
   responsive transformations, component inventory, and interaction states.
4. Reuse established components and tokens. Extend existing primitives before
   adding a parallel design system.
5. Preserve supported product behavior. Do not invent features, metrics, or
   controls without a product need.
6. Run the app and inspect at desktop 1440x1000, tablet 1024x768, and mobile
   390x844.
7. Capture screenshots and check hierarchy, alignment, typography, whitespace,
   panel proportions, accessibility, and responsive priority. Fix issues and
   inspect again.
8. Run the appropriate design and motion audits, then run `npm run build`.

## Responsive And Interaction Requirements

- Define what remains visible, collapses, becomes a drawer, changes priority,
  or defers on mobile. Do not merely stack desktop columns.
- Every interactive element needs default, hover, focus-visible, active,
  selected, disabled, and loading states where relevant.
- Repeated dimensions belong in design tokens or reusable component variants.

## Motion Rules

- Apply a frequency gate: daily and repeated interactions should be instant or
  nearly instant.
- Animate only to clarify state, spatial continuity, hierarchy, or press
  feedback.
- Favor transform and opacity; avoid animating layout properties.
- Use custom easing, subtle press feedback, and durations below 300ms for
  ordinary interface transitions.
- Gate hover transforms behind `hover: hover` and `pointer: fine`.
- Ship `prefers-reduced-motion` behavior with every motion change.
- Audit changed motion behavior before handoff.

## Engineering Guardrails

- Preserve the deck model, local persistence, prompts, generation loops, and
  rendering pipeline unless a task explicitly changes them.
- Keep interface changes responsive and keyboard-accessible.
- Keep edits focused and preserve user changes already present in the worktree.
- Use `apply_patch` for manual edits.
- Run `npm run build` after implementation changes.
