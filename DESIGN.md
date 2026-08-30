# Design System

## Overview

**Creative North Star**: "The Working Canvas."

Initiate is an operational workspace. The interface should feel like one continuous canvas where people can scan information, compare options, and take action without navigating through layers of decorative containers. Structure comes from typography, spacing, dividers, and restrained tonal changes.

Pages fill the available width. They do not sit inside a centered wrapper or a floating page card. Cards represent real objects such as services, organizations, plans, or grants. They never wrap a page simply to make it look finished.

The interface is compact without feeling cramped. Blue marks actions and selected states. Neutral surfaces carry most of the screen so dense tables, forms, and navigation remain readable in both themes.

**Key Characteristics**:

- Full-width page layouts with no outer container margin.
- Flat, border-led sections instead of stacked page cards.
- Compact controls and predictable information density.
- One blue action color used for selection, focus, and primary actions.
- Equal support for light and dark themes.

## Colors

The palette is neutral first. A clear cobalt blue provides the only routine accent, while red is reserved for destructive actions and errors.

### Primary

- **Action Blue**: Use for primary buttons, selected navigation, links, focus rings, text selection, and the first chart series.
- **Deep Action Blue**: Use for selected or emphasized states that need stronger contrast, especially in dark mode.
- **Selection Wash**: Use as the quiet background for hover, selected navigation, and secondary emphasis in light mode.

### Secondary

- **Destructive Red**: Use only for deletion, irreversible actions, and error states. Do not use it as decoration.

### Neutral

- **Light Canvas**: The light theme page, card, and popover base.
- **Light Ink**: The light theme primary text color.
- **Light Muted Surface**: A subtle light theme fill for grouped or secondary content.
- **Light Muted Ink**: Supporting copy, metadata, placeholders, and inactive labels in the light theme.
- **Light Rule**: Borders, input strokes, row separators, and section dividers in the light theme.
- **Dark Canvas**: The dark theme page and sidebar base.
- **Dark Surface**: Cards, popovers, muted areas, and secondary controls in the dark theme.
- **Dark Ink**: The dark theme primary text color.
- **Dark Muted Ink**: Supporting copy, metadata, placeholders, and inactive labels in the dark theme.
- **Dark Rule**: Borders, input strokes, row separators, and section dividers in the dark theme.

**The One Accent Rule.** Blue should carry no more meaning than action, focus, and selection on operational pages. Do not introduce page-specific accent palettes.

**The Semantic Color Rule.** Green, amber, and red may communicate state. They must not become large decorative fields or compete with the primary action.

## Typography

**Display Font**: Montserrat Variable with a system sans-serif fallback.

**Body Font**: Montserrat Variable with a system sans-serif fallback.

**Reading Font**: Lora Variable with Georgia as a fallback. Reserve it for deliberate long-form editorial content.

**Code Font**: Fira Code Variable with a monospace fallback.

**Character**: Montserrat gives the product a direct, technical voice without making the interface feel clinical. Weight and size establish hierarchy. Decorative type treatments do not.

### Hierarchy

- **Display**: Use the responsive display role only for public landing banners and major editorial statements. Keep it out of management screens.
- **Headline**: Use for top-level public section headings and prominent marketplace groups.
- **Title**: Use for page titles. Management pages use a compact title that grows one step on larger screens.
- **Body**: Use for controls, rows, descriptions, and routine application copy. Default to the compact body size.
- **Label**: Use for metadata, navigation group labels, badges, and helper text. Keep labels in sentence case unless the source data requires otherwise.
- **Code**: Use for IDs, invoice references, durations, technical values, and code. Do not use monospace as decoration.

**The Compact Heading Rule.** Operational page titles stop at the title role. Oversized headings belong to public storytelling pages, not dashboards, lists, editors, or settings.

## Layout

The application shell uses a fixed top navigation bar at 64 pixels high. Management pages add a 256-pixel desktop sidebar that can collapse to 48 pixels. On small screens, the sidebar becomes an 288-pixel sheet.

Page content uses the full remaining width. `PageShell` provides the page boundary. `PageHeader` creates a responsive title and action row with a bottom divider. `PageContent` applies 16 pixels of padding on small screens and 24 pixels from the small breakpoint upward. Do not add another width-limiting wrapper around these elements.

Use the 4-pixel spacing scale. Routine clusters use 8, 12, or 16 pixels. Page gutters and substantial component padding use 20 or 24 pixels. Use 32 pixels or more only for major public-page rhythm, empty states, or deliberate section breaks.

Tables and dense lists should stretch across the page. Let wide tables scroll horizontally rather than compressing columns into unreadable widths. Use borders and sticky headers to preserve structure. Summary metrics may form responsive grids with shared dividers instead of separate floating cards.

At narrow widths, stack header content and actions. Preserve touch targets near 44 pixels where space permits. Move dense secondary navigation into sheets, menus, or horizontally scrollable tab rows instead of shrinking labels beyond readability.

**The Edge-to-Edge Rule.** A page may have internal padding, but it must not sit inside a centered `max-width` container or an outer card.

**The Divider Grid Rule.** When several peer metrics or panels share a row, place them in one grid and separate them with rules. Do not render each metric as an elevated card.

## Elevation & Depth

Initiate is flat by default. Page hierarchy comes from canvas color, subtle surface changes, and one-pixel borders. Static page sections and object cards do not need a shadow.

Small shadows may clarify compact controls and the fixed top navigation. Medium and large shadows belong to temporary layers such as menus, popovers, dialogs, rich-text toolbars, and call controls. These layers should still have a visible border.

**The Flat-by-Default Rule.** If an element remains in the document flow and a divider can express its boundary, use the divider and remove the shadow.

**The Temporary-Layer Rule.** Shadows indicate content that sits above the current task. Do not use them to make ordinary sections look clickable.

## Shapes

The default form language uses gently rounded controls. Inputs, buttons, badges, menus, and navigation items use the medium radius. Object cards and dialogs use the large radius. Avatars, status dots, and circular icon treatments may use a full radius.

Full-width sections, tables, analytics cells, tab bars, and editor groups use square outer edges when they meet the page boundary. Adjacent controls should share an edge or use only the outer corner radii.

Borders are one pixel and use the semantic rule color for the active theme. Avoid ornamental border thickness. A two-pixel border is appropriate only when it communicates a strong live state that cannot rely on color alone.

**The Object Boundary Rule.** Rounded containers identify discrete objects. Page structure stays square and edge aligned.

## Components

### Pages

- **Page Shell**: Always fills the available width and establishes the main content boundary.
- **Page Header**: Uses a bottom border, compact title, optional description, and actions that stack on small screens.
- **Page Content**: Uses responsive page padding and never adds a centered maximum width by default.
- **Page Section**: Uses a bottom divider. Prefer it over a card when the content is part of the page itself.

### Buttons

- **Shape**: Use gently rounded corners and compact heights. The standard control is 36 pixels high.
- **Primary**: Use Action Blue with white text. Reserve it for the main action in the local task area.
- **Secondary**: Use a muted fill and normal foreground text for supporting actions.
- **Outline**: Use the canvas background and a one-pixel border for actions that need more presence than a ghost button.
- **Ghost**: Use for navigation, toolbars, and low-emphasis actions. Reveal a soft accent fill on hover or selection.
- **Destructive**: Use Destructive Red and explicit action text. Require confirmation when the result is difficult to reverse.
- **Focus**: Show the semantic ring as a three-pixel translucent halo plus a border color shift.
- **Motion**: Transition only color, background, border, shadow, or opacity. Do not use `transition-all` or movement for routine button hover states.

### Cards And Containers

- **Object Cards**: Use the card surface, a one-pixel border, a large radius, and no resting shadow.
- **Page Sections**: Use square edges and horizontal dividers. They may use a subtle muted fill to distinguish a tool area.
- **Interactive Cards**: Change background or border on hover. Do not lift or scale the card.
- **Internal Padding**: Use 16 pixels for compact objects and 24 pixels for primary object cards.

### Inputs And Fields

- **Style**: Use a transparent or faintly tinted background, a one-pixel input border, medium corners, and a 36-pixel standard height.
- **Focus**: Shift the border to Action Blue and add the same focus halo used by buttons.
- **Invalid**: Use the destructive border and ring treatment. Pair color with a clear text message.
- **Disabled**: Reduce opacity and remove pointer interaction. Preserve readable labels.
- **Groups**: Keep related fields in a simple grid or divided section. Do not wrap each field in its own card.

### Badges And Status

- **Style**: Use compact, medium-radius labels with 2 pixels of vertical padding and 8 pixels of horizontal padding.
- **State**: Use filled blue for selected or primary status, a neutral fill for supporting status, an outline for quiet metadata, and red for destructive or failed status.
- **Copy**: Keep labels short and literal. Do not use badges for full sentences.

### Tables And Lists

- **Structure**: Stretch across the available width and separate rows with one-pixel rules.
- **Header**: Use a stable canvas background. Make it sticky when the table scrolls vertically.
- **Rows**: Use a subtle muted hover fill. Keep actions aligned in the final column.
- **Empty And Error States**: Occupy the same full-width region as the data. State what happened and provide the next available action.

### Navigation

- **Top Navigation**: Use a 64-pixel fixed bar with a bottom border, a very small structural shadow, and a centered search field on desktop.
- **Sidebar**: Use the theme canvas or muted surface. Group links with small labels and use a soft blue fill for the active item.
- **Icon Actions**: Provide an accessible name and a tooltip when the meaning is not visible in text.
- **Mobile**: Replace the desktop link row and sidebar with sheets. Keep search and the profile action visible.

### Dialogs And Menus

- **Dialogs**: Use a bordered large-radius surface above a dark translucent overlay. Keep the content width task appropriate.
- **Menus And Popovers**: Use a bordered popover surface, medium corners, and enough shadow to separate the temporary layer.
- **Animation**: Use short fades, small scale changes, or directional entrance motion. Honor reduced-motion preferences.

## Do's and Don'ts

### Do

- **Do** start operational pages with `PageShell`, `PageHeader`, and `PageContent` or `PageSection`.
- **Do** let tables, editors, timelines, and management lists use the full available width.
- **Do** use borders, dividers, typography, and small tonal changes to create hierarchy.
- **Do** reserve cards for discrete objects that users can inspect, select, compare, or act on.
- **Do** keep primary actions blue and destructive actions red across both themes.
- **Do** provide visible focus styles, accessible names for icon buttons, and reduced-motion behavior.
- **Do** write clear empty, loading, error, and success states that preserve the page layout.

### Don't

- **Don't** place an operational page inside a centered container, floating panel, or decorative outer card.
- **Don't** use separate elevated cards for every metric, form group, or list section.
- **Don't** add shadows to static page content when a divider communicates the same boundary.
- **Don't** lift, translate, or scale routine cards on hover.
- **Don't** introduce gradients, glass effects, or page-specific accent colors into management screens.
- **Don't** use oversized marketing typography in dashboards, settings, tables, editors, or detail views.
- **Don't** hide a failed request behind zero values, blank content, or editable defaults that appear saved.
- **Don't** use `transition-all`; name the properties that change.
