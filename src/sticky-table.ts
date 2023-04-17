export function addTableCellAriaRowColIndexes(table: HTMLTableElement) {
	const trs = table.querySelectorAll<HTMLTableRowElement>('tr');

	const rowCount = trs.length;
	if (rowCount === 0) return;

	let colCount = 0;
	for (const cell of trs.item(0).children) {
		colCount += (cell as HTMLTableCellElement).colSpan;
	}
	if (colCount === 0) return;

	if (!table.getAttribute('aria-rowcount')) {
		table.setAttribute('aria-rowcount', rowCount.toString());
	}
	if (!table.getAttribute('aria-colcount')) {
		table.setAttribute('aria-colcount', colCount.toString());
	}

	let cellIndex = 0;
	const cells = table.querySelectorAll<HTMLTableCellElement>('table>thead>tr>th, table>thead>tr>td, table>tbody>tr>th, table>tbody>tr>td');
	const grid = Array.from({ length: rowCount }, () => Array(colCount));
	for (let i = 0; i < rowCount; i++) {
		for (let j = 0; j < colCount; j++) {
			if (grid[i][j]) continue; // find next available grid position

			const cell = cells.item(cellIndex++);
			if (!cell.getAttribute('aria-colindex')) {
				cell.setAttribute('aria-colindex', (j + 1).toString());
			}
			if (!cell.getAttribute('aria-rowindex')) {
				cell.setAttribute('aria-rowindex', (i + 1).toString());
			}

			// occupy grid positions for current cell
			for (let m = i; m < i + cell.rowSpan; m++) {
				for (let n = j; n < j + cell.colSpan; n++) {
					grid[m][n] = true;
				}
			}
		}
	}
}

export function addStickyTableCssVariables(table: HTMLTableElement, offsetTop = 0, offsetLeft = 0) {
	let c = 0;
	let el: HTMLTableCellElement | null = null;
	let topSum = offsetTop;
	while (el = table.querySelector<HTMLTableCellElement>('table>thead>tr>th[aria-rowindex="' + (++c) + '"]:not([rowspan])')) {
		table.style.setProperty(`--stickytables-row-${c}-top`, topSum + 'px');
		// NOTE: el.offsetHeight is rounded to int by browsers
		topSum += Number.parseFloat(window.getComputedStyle(el)?.height ?? el.offsetHeight);
	}
	table.style.setProperty('--stickytables-top', topSum + 'px');

	c = 0;
	el = null;
	let leftSum = offsetLeft;
	while (el = table.querySelector<HTMLTableCellElement>('table>tbody>tr>th[aria-colindex="' + (++c) + '"]:not([colspan])')) {
		table.style.setProperty(`--stickytables-col-${c}-left`, leftSum + 'px');
		// NOTE: el.offsetWidth is rounded to int by browsers
		leftSum += Number.parseFloat(window.getComputedStyle(el)?.width ?? el.offsetWidth);
	}
	table.style.setProperty('--stickytables-left', leftSum + 'px');
}

const stickyWrapCell = (cell: HTMLTableCellElement) => {
	const wrap = document.createElement('span');
	wrap.classList.add('sticky');
	while (cell.firstChild) {
		wrap.append(cell.firstChild);
	}
	cell.appendChild(wrap);
};

export function stickyWrapHeadContent(table: HTMLTableElement) {
	let sideCount = 0;
	while (table.querySelector<HTMLTableCellElement>('table>thead>tr>th[aria-colindex="' + (sideCount + 1) + '"]:not([colspan])')) {
		sideCount++;
	}

	const colCount = Number(table.getAttribute('aria-colcount') ?? '0');
	for (let col = sideCount + 1; col <= colCount; col++) {
		table.querySelectorAll<HTMLTableCellElement>('table>thead>tr>th[aria-colindex="' + col + '"]')
			.forEach(stickyWrapCell);
	}
}

export function stickyWrapSideContent(table: HTMLTableElement) {
	const rowCount = Number(table.getAttribute('aria-rowcount') ?? '0');
	for (let row = 1; row <= rowCount; row++) {
		table.querySelectorAll<HTMLTableCellElement>('table>tbody>tr>th[aria-rowindex="' + row + '"]')
			.forEach(stickyWrapCell);
	}
}

export function stickyWrapSectionsContent(table: HTMLTableElement) {
	table.querySelectorAll<HTMLTableCellElement>('table>tbody>tr.sticky>th')
		.forEach(stickyWrapCell);
}

// offset sidebar content by section headers height (first section head measured, all must be the same)
export function offsetTopsForSectionsWhenSideContentSticky(table: HTMLTableElement) {
	const stickyRowHeading = table.querySelector<HTMLTableCellElement>('table>tbody>tr.sticky>th');
	if (stickyRowHeading) {
		const tableTop = table.style.getPropertyValue('--stickytables-top');
		table.querySelectorAll<HTMLTableRowElement>('table>tbody>tr.sticky')
			.forEach(tr => tr.style.setProperty('--stickytables-top', tableTop));

		const rowHeadingHeight = Number.parseFloat(window.getComputedStyle(stickyRowHeading)?.height ?? stickyRowHeading.offsetHeight);
		const offseted = (Number.parseFloat(tableTop) + rowHeadingHeight) + 'px';
		table.style.setProperty('--stickytables-top', offseted);
	}
}

export function addViewportCssVariables() {
	document.documentElement.style.setProperty(
		'--viewport-width',
		document.documentElement.clientWidth + 'px'
	);
}

export function addPaddingCssVaraibles(table: HTMLTableElement) {
	const firstCell = table.querySelector('th');
	if (!firstCell) return;

	const computedStyle = window.getComputedStyle(firstCell);

	table.style.setProperty('--padding-top', computedStyle?.paddingTop ?? '0px');
	table.style.setProperty('--padding-right', computedStyle?.paddingRight ?? '0px');
	table.style.setProperty('--padding-bottom', computedStyle?.paddingBottom ?? '0px');
	table.style.setProperty('--padding-left', computedStyle?.paddingLeft ?? '0px');
}

interface InitOptions {
	/** When `aria-colindex` and `aria-rowindex` does not exists, a we generate them programmatically. */
	ariaRowColIndexesExisting?: boolean;

	/** CSS selector of the table element. */
	customSelector?: string;

	/** Boolean or a single class name that marks section headers table rows. */
	stickySections?: boolean | string;

	/** Header cell contents wrapped in a sticky box to stick to screen when cells are wide. */
	stickyWrapHeadContent?: boolean;

	/** Sidebar cell contents wrapped in a sticky box to stick to screen when cells are tall. */
	stickyWrapSideContent?: boolean;

	/** Section content wrapped in a sticky box, centered on screen. */
	stickyWrapSectionsContent?: boolean;

	/** Set and manage --viewport-width CSS variable on DocumentElement, required by sticky-wrapped section cells. */
	addViewportWidthVars?: boolean;

	/** Set --padding-{top,right,bottom,left} CSS variables on the table element on load, required by sticky-wrapped cells. */
	addPaddingVars?: boolean;

	/** Offset sticky table screen top position. */
	offsetTop?: number | { (): number; };

	/** Offset sticky table screen left position. */
	offsetLeft?: number | { (): number; };
}

export function init(options: InitOptions = {}) {
	const tableSelector = options.customSelector ?? 'table.sticky';

	if (options.addViewportWidthVars) {
		window.addEventListener('DOMContentLoaded', addViewportCssVariables);
		window.addEventListener('load', addViewportCssVariables);
		window.addEventListener('resize', addViewportCssVariables);
	}

	window.addEventListener('DOMContentLoaded', () => {
		for (const table of document.querySelectorAll<HTMLTableElement>(tableSelector)) {
			table.classList.add('sticky');
			if (options.stickySections) {
				table.querySelectorAll<HTMLTableRowElement>(
					tableSelector + '>tbody>tr.' + (options.stickySections ?? 'section')
				).forEach(tr => {
					tr.classList.add('sticky');
				});
			}

			if (!options.ariaRowColIndexesExisting) {
				addTableCellAriaRowColIndexes(table);
			}
		}
	});

	window.addEventListener('load', () => {
		const offsetTop = typeof options.offsetTop === 'function' ? options.offsetTop() : options.offsetTop;
		const offsetLeft = typeof options.offsetLeft === 'function' ? options.offsetLeft() : options.offsetLeft;
		for (const table of document.querySelectorAll<HTMLTableElement>(tableSelector)) {
			addStickyTableCssVariables(table, offsetTop, offsetLeft);
			if (options.stickyWrapHeadContent) {
				stickyWrapHeadContent(table);
			}
			if (options.stickyWrapSideContent) {
				stickyWrapSideContent(table);
				if (options.stickySections) {
					offsetTopsForSectionsWhenSideContentSticky(table);
				}
			}
			if (options.stickyWrapSectionsContent) {
				stickyWrapSectionsContent(table);
			}
			if (options.addPaddingVars) {
				addPaddingCssVaraibles(table);
			}
		}
	});

	// fixes zooming and reflowing texts
	window.addEventListener('resize', () => {
		const offsetTop = typeof options.offsetTop === 'function' ? options.offsetTop() : options.offsetTop;
		const offsetLeft = typeof options.offsetLeft === 'function' ? options.offsetLeft() : options.offsetLeft;
		for (const table of document.querySelectorAll<HTMLTableElement>(tableSelector)) {
			addStickyTableCssVariables(table, offsetTop, offsetLeft);
		}
	});
}
