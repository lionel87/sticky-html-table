# sticky-table

Tools to make large HTML table headers and sidebars to stick on the screen when scrolling.

## Anatomy of a table

(or atleast what this package assumes and prepares for)

A table consists of
- a header
- a sidebar
- optionally multiple sections, where a section has its own single row section header
- a single table body, or multiple, one for each section

The table header can have multiple rows, and any kind of merged cells. Table headers (`<thead>`) only contains `<th>` elements.

The table sidebar can have multiple columns, and any kind of merged cells. The `<th>` cells which contained in a `<tbody>` element are considered to be sidebar cells.

A table section header is a single table row usually fully merged and stlyed like the table header.

Sections can be separated into their own `<tbody>` where the first row is the section header, or just left in one big `<tbody>` element.

> Note: The `<tfoot>` element has no role in this implementation, and may break the table if used.
> Note: The `<colgroup>` element can be used to style the table columns freely.

## Usage

1. Include the CSS and JS into your HTML document.
  - Include prebuilt in HTML: `dist/sticky-table.css` and `dist/sticky-table.js`.
  - Or import source and build: `src/sticky-table.scss` in Sass and `src/sticky-table.ts` in TS module.

2. Mark your table element with `sticky` class, or call `StickyTables.init(options)` to access advanced customization options.


### Example
```html
<table class="sticky">
  <thead>
    <tr><th>A</th><th>B</th><th>C</th></tr>
    <tr><th>AA</th><th>BB</th><th>CC</th></tr>
  </thead>
  <tbody>
    <tr class="sticky"><th colspan="3">Block 1</th></tr>
    <tr><th>1</th><th>11</th><th>111</th></tr>
    <tr><th>2</th><th>22</th><th>222</th></tr>
    <tr><th>3</th><th>33</th><th>333</th></tr>
  </tbody>
  <tbody>
    <tr class="sticky"><th colspan="3">Block 2</th></tr>
    <tr><th>1</th><th>11</th><th>111</th></tr>
    <tr><th>2</th><th>22</th><th>222</th></tr>
    <tr><th>3</th><th>33</th><th>333</th></tr>
  </tbody>
</table>
<script>
  StickyTables.init();
</script>
```

## CSS implementation notes

For the CSS to work it is required to have `aria-colindex` and `aria-rowindex` attributes on every table cell.
This helps to properly reference each header row and each sidebar column targeted to be sticky.
The `addTableCellAriaRowColIndexes(table)` function is responsible to add these aria attributes to each cell when these are missing.

To position each row and column correctly, we use CSS properties that is applied by `addStickyTableCssVariables(table)` function to the table element. This defines each row height and each column width which allows us to have multi-row tall header and multi-column wide sidebar.

Our tables can have sections, usually in a form of the whole table row merged together.
This package currently provides support for sections only in vertical axis direction, with a limitation of equal height rows for the section headers.
Mark each row element with `sticky` class and the row will always stick below the table header while scrolling down.

### Classes

Only a `sticky` class is defined, and does different things when present on different elements.

- On a `<table>` element: Makes the table header and sidebar to be sticky.
- On a `<tr>` element: Makes the entire row stick to the table viewport.
- On a `<span>` in a table cell: Makes the contents of the cell stick to the table viewport. Eg. for merged cells spanning a lot of columns/rows containing some text that should be visible.

> Note: Sticky rows (section headers) can have sticky spans in them. The sticky span makes the content always aligned to screen center.

### CSS variables

The following CSS variables used when we position the cells:

- `--stickytables-row-<i>-top`: To offset table header rows from the top.
- `--stickytables-column-<i>-left`: To offset table sidebar columns from the left side.
- `--stickytables-top`: To offset anything below the last table header row.
- `--stickytables-left`: To offset anything next to the last table sidebar column.
- `--viewport-width`: Defines the table max visible area. Used when the table section header contains `<span class="sticky">` elements.
- `--padding-{top,right,bottom,left}`: Cell padding. Used when table cells has `<span class="sticky">` elements.

These variables can be generated with the `init()` call automatically.


## Docs

### `init(options: InitOptions = {}): void`

This call prepares the table to work with the suppiled css.

You can specify the following options

- `ariaRowColIndexesExisting?: boolean;`

  When `aria-colindex` and `aria-rowindex` does not exists, a we generate them programmatically.

  Default: `false`


- `customSelector?: string;`

	CSS selector of the table element.

  Default: `table.sticky`


- `stickySections?: boolean | string;`

  Boolean or a single class name that marks section headers table rows.

  When `true` it targets rows with `sticky` class name.

  Default: `false`


- `stickyWrapHeadContent?: boolean;`

	Header cell contents wrapped in a sticky box to stick to screen when cells are wide.

  Default: `false`

- `stickyWrapSideContent?: boolean;`

  Sidebar cell contents wrapped in a sticky box to stick to screen when cells are tall

  Default: `false`


- `stickyWrapSectionsContent?: boolean;`

  Section content wrapped in a sticky box, centered on screen.

  Default: `false`


- `addViewportWidthVars?: boolean;`

  Set and manage --viewport-width CSS variable on DocumentElement, required by sticky-wrapped section cells.

  Default: `false`


- `addPaddingVars?: boolean;`

  Set --padding-{top,right,bottom,left} CSS variables on the table element on load, required by sticky-wrapped cells.

  Default: `false`



- `offsetTop?: number | { (): number };`

  Offset sticky table screen top position.

  Default: `0`


- `offsetLeft?: number | { (): number };`

  Offset sticky table screen left position.

  Default: `0`


### `addTableCellAriaRowColIndexes(table: HTMLTableElement): void`

Generates the `aria-colindex` and `aria-rowindex` attributes on table cells.

Called by init when `ariaRowColIndexesExisting: true`.


### `addStickyTableCssVariables(table: HTMLTableElement, offsetTop = 0, offsetLeft = 0): void`

Generates CSS vairables required to keep multiple rows and columns on screen.

Always called by init.


### `stickyWrapHeadContent(table: HTMLTableElement): void`

Wraps each header cells content into a sticky box that keeps the cell content on-screen as much as possible.

Called by init when `stickyWrapHeadContent: true`.


### `stickyWrapSideContent(table: HTMLTableElement): void`

Wraps each sidebar cells content into a sticky box that keeps the cell content on-screen as much as possible.

Called by init when `stickyWrapSideContent: true`.

### `stickyWrapSectionsContent(table: HTMLTableElement): void`

Wraps each section header cell content into a sticky box that keeps the cell content on-screen and centered as much as possible.

Called by init when `stickyWrapSectionsContent: true`.

### `offsetTopsForSectionsWhenSideContentSticky(table: HTMLTableElement): void`

Modify the calculated CSS variables, account for section headers. Only useful when you called `stickyWrapSideContent()` and have table sections.

Called by init when `stickyWrapSideContent: true` and `stickySections: true | string`.

### `addViewportCssVariables(): void`

Generates the `--viewport-width` CSS variable. This is the same as `100vw - scrollbar width`. Only useful when `stickyWrapSectionsContent: true` and `stickySections: true | string`.

Called by init when `addViewportWidthVars: true`.

### `addPaddingCssVaraibles(table: HTMLTableElement): void`

Set `--padding-{top,right,bottom,left}` CSS variables on the table element on load. Required by sticky-wrapped cells. Only useful when `stickyWrapHeadContent: true`, `stickyWrapSideContent: true` or `stickyWrapSectionsContent: true`.

Called by init when `addPaddingVars: true`.
