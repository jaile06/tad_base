/**
 * CKEditor 5 設定，由 class/CkEditor5.php 呼叫 createEditor()
 * 原始設定由 CKEditor 5 Builder 產生：
 * https://ckeditor.com/ckeditor-5/builder/#installation/NoNgNARATAdA7DAzBSBGADAFgKyN9kKERKVTOEgDkwE5NNLEya50bU5KiptMfqUEAF4ALFOjDBUYCbLDT0AXUgAzFTUroo6CIqA=
 */

import {
	ClassicEditor,
	Alignment,
	Autoformat,
	AutoImage,
	AutoLink,
	Autosave,
	BlockQuote,
	Bold,
	Code,
	CodeBlock,
	Essentials,
	FindAndReplace,
	FontBackgroundColor,
	FontColor,
	FontFamily,
	FontSize,
	FullPage,
	GeneralHtmlSupport,
	Heading,
	Highlight,
	HorizontalLine,
	HtmlComment,
	HtmlEmbed,
	ImageBlock,
	ImageCaption,
	ImageInline,
	ImageInsert,
	ImageInsertViaUrl,
	ImageResize,
	ImageStyle,
	ImageTextAlternative,
	ImageToolbar,
	ImageUpload,
	Indent,
	IndentBlock,
	Italic,
	Link,
	LinkImage,
	List,
	ListProperties,
	MediaEmbed,
	Paragraph,
	PasteFromMarkdownExperimental,
	PasteFromOffice,
	PlainTableOutput,
	RemoveFormat,
	ShowBlocks,
	SimpleUploadAdapter,
	SourceEditing,
	Strikethrough,
	Style,
	Subscript,
	Superscript,
	Table,
	TableCaption,
	TableCellProperties,
	TableColumnResize,
	TableLayout,
	TableProperties,
	TableToolbar,
	TextTransformation,
	TodoList,
	Underline,
	WordCount,
	PageBreak,
	ButtonView,
	IconBrowseFiles,
	IconImage
} from './ckeditor5.js';

import translations from './translations/zh.js';

const toolbars = {
	full: [
		'undo', 'redo', '|',
		'sourceEditing', 'showBlocks', '|',
		'heading', 'style', '|',
		'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
		'bold', 'italic', 'underline', '|',
		'link', 'insertImage', 'browse_image', 'browse_file', 'mediaEmbed', 'insertTable', 'insertTableLayout', '|',
		'highlight', 'blockQuote', 'codeBlock', 'horizontalLine', 'pageBreak', '|',
		'alignment', '|',
		'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent'
	],
	basic: [
		'undo', 'redo', '|',
		'bold', 'italic', 'underline', '|',
		'link', 'insertImage', '|',
		'bulletedList', 'numberedList'
	]
};

// 對應 CK4 CkEditor::getStyle()（只支援 class，inline style 的項目略過）
const styleDefinitions = [
	['Info 提示框', 'div', 'alert alert-info'],
	['Success 提示框', 'div', 'alert alert-success'],
	['Warning 提示框', 'div', 'alert alert-warning'],
	['Danger 提示框', 'div', 'alert alert-danger'],
	['公文編號「一、(一)、１」', 'ol', 'paper-list'],
	['巢狀清單「1.、(1)、A.」', 'ol', 'my-list'],
	['清單「壹、貳」', 'ol', 'big-tw'],
	['清單「一、二」', 'ol', 'small-tw'],
	['清單「(一)、(二)」', 'ol', 'brackets-tw'],
	['清單「1.、2.」', 'ol', 'dot-num'],
	['清單「(1)、(2)」', 'ol', 'brackets-num'],
	['Secondary 徽章', 'span', 'badge bg-secondary'],
	['Primary 徽章', 'span', 'badge bg-primary'],
	['Success 徽章', 'span', 'badge bg-success'],
	['Info 徽章', 'span', 'badge bg-info'],
	['Warning 徽章', 'span', 'badge bg-warning'],
	['Danger 徽章', 'span', 'badge bg-danger'],
	['Light 徽章', 'span', 'badge bg-light'],
	['Dark 徽章', 'span', 'badge bg-dark'],
	['按鍵', 'kbd', 'kbd']
].map(([name, element, cls]) => ({ name, element, classes: cls.split(' ') }));

// 取代 CK4 quicktable 的 qtClass：輸出的表格自動帶 Bootstrap class
function BootstrapTable(editor) {
	editor.conversion.for('dataDowncast').add(dispatcher => dispatcher.on('insert:table', (evt, data, api) => {
		const view = api.mapper.toViewElement(data.item);
		const table = view?.is('element', 'table') ? view : view && [...view.getChildren()].find(c => c.is('element', 'table'));
		if (table) {
			api.writer.addClass(['table', 'table-bordered', 'table-hover', 'table-sm'], table);
		}
	}, { priority: 'lowest' }));
}

// 取代 elFinder：用原生 <dialog> 列出 browse.php 回傳的檔案，點選插入
function FileBrowser(editor) {
	const { browseUrl } = editor.config.get('tad') || {};
	if (!browseUrl) {
		return;
	}
	const insert = (type, url) => {
		if (type === 'image') {
			return editor.execute('insertImage', { source: url });
		}
		if (!editor.model.document.selection.isCollapsed) {
			return editor.execute('link', url);
		}
		editor.model.change(writer => {
			editor.model.insertContent(writer.createText(decodeURIComponent(url.split('/').pop()), { linkHref: url }));
		});
	};
	[['image', '從伺服器選圖片', IconImage], ['file', '從伺服器選檔案', IconBrowseFiles]].forEach(([type, label, icon]) => {
		editor.ui.componentFactory.add(`browse_${type}`, locale => {
			const button = new ButtonView(locale);
			button.set({ label, icon, tooltip: true });
			button.on('execute', () => openBrowser(browseUrl, type, label, url => insert(type, url)));
			return button;
		});
	});
}

// 檔名可能含任意字元，一律用 textContent / 屬性設定，不用 innerHTML
async function openBrowser(browseUrl, type, title, onPick) {
	const url = new URL(browseUrl, location.href);
	url.searchParams.set('type', type);
	const files = await fetch(url).then(r => r.json()).catch(() => ({ error: '讀取失敗' }));

	const dialog = document.createElement('dialog');
	dialog.className = 'ck5-browser';
	dialog.setAttribute('aria-label', title);
	const header = document.createElement('form');
	header.method = 'dialog';
	header.className = 'ck5-browser-header';
	const h = document.createElement('strong');
	h.textContent = title;
	const close = document.createElement('button');
	close.textContent = '×';
	close.setAttribute('aria-label', '關閉');
	header.append(h, close);
	const grid = document.createElement('div');
	grid.className = 'ck5-browser-grid';
	dialog.append(header, grid);

	if (!Array.isArray(files) || !files.length) {
		grid.textContent = files.error || '目前沒有檔案，可直接拖曳或貼上上傳';
	} else {
		for (const f of files) {
			const item = document.createElement('button');
			item.type = 'button';
			item.title = f.name;
			if (type === 'image') {
				const img = document.createElement('img');
				img.src = f.url;
				img.alt = f.name;
				img.loading = 'lazy';
				item.append(img);
			}
			const name = document.createElement('span');
			name.textContent = f.name;
			item.append(name);
			item.addEventListener('click', () => { dialog.close(); onPick(f.url); });
			grid.append(item);
		}
	}
	dialog.addEventListener('close', () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
}

// 取代 CK4 pasteUploadImage 的 pasteUploadImageUrlApi：貼上的外站圖片下載到本站
function PasteRemoteImage(editor) {
	const { remoteImageUrl } = editor.config.get('tad') || {};
	if (!remoteImageUrl) {
		return;
	}
	const localize = async src => {
		const res = await fetch(`${remoteImageUrl}&url=${encodeURIComponent(src)}`).then(r => r.json()).catch(() => null);
		if (!res?.url) {
			return;
		}
		editor.model.change(writer => {
			for (const { item } of writer.createRangeIn(editor.model.document.getRoot())) {
				if (item.is('element') && item.getAttribute('src') === src) {
					writer.setAttribute('src', res.url, item);
				}
			}
		});
	};
	editor.plugins.get('ClipboardPipeline').on('inputTransformation', (evt, data) => {
		for (const { item } of editor.editing.view.createRangeIn(data.content)) {
			const src = item.is('element', 'img') && item.getAttribute('src');
			if (src && /^https?:\/\//i.test(src) && !src.startsWith(location.origin)) {
				localize(src);
			}
		}
	});
}

export function createEditor(element, { uploadUrl, browseUrl, remoteImageUrl, placeholder = '', toolbar = 'full', height } = {}) {
	return ClassicEditor.create(element, {
		tad: { browseUrl, remoteImageUrl },
		licenseKey: 'GPL',
		language: 'zh',
		translations: [translations],
		toolbar: { items: toolbars[toolbar] || toolbars.full, shouldNotGroupWhenFull: true },
		menuBar: { isVisible: toolbar === 'full' },
		placeholder,
		plugins: [
			Alignment, Autoformat, AutoImage, AutoLink, Autosave, BlockQuote, Bold, Code, CodeBlock, Essentials,
			FindAndReplace, FontBackgroundColor, FontColor, FontFamily, FontSize, FullPage, GeneralHtmlSupport,
			Heading, Highlight, HorizontalLine, HtmlComment, HtmlEmbed, ImageBlock, ImageCaption, ImageInline,
			ImageInsert, ImageInsertViaUrl, ImageResize, ImageStyle, ImageTextAlternative, ImageToolbar, ImageUpload,
			Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties, MediaEmbed, Paragraph,
			PasteFromMarkdownExperimental, PasteFromOffice, PlainTableOutput, RemoveFormat, ShowBlocks,
			SimpleUploadAdapter, SourceEditing, Strikethrough, Style, Subscript, Superscript, Table, TableCaption,
			TableCellProperties, TableColumnResize, TableLayout, TableProperties, TableToolbar, TextTransformation,
			TodoList, Underline, WordCount, PageBreak,
			BootstrapTable, FileBrowser, PasteRemoteImage
		],
		// 取代 CK4 embed/embedsemantic：直接輸出 iframe，前台不需額外 JS
		mediaEmbed: { previewsInData: true },
		// 取代 CK4 syntaxhighlight/prism/codesnippet：輸出 <pre><code class="language-xxx">，prism 可直接上色
		codeBlock: {
			languages: [
				{ language: 'plaintext', label: '純文字' },
				{ language: 'html', label: 'HTML' },
				{ language: 'css', label: 'CSS' },
				{ language: 'javascript', label: 'JavaScript' },
				{ language: 'php', label: 'PHP' },
				{ language: 'sql', label: 'SQL' },
				{ language: 'python', label: 'Python' },
				{ language: 'bash', label: 'Bash' },
				{ language: 'json', label: 'JSON' }
			]
		},
		fontFamily: { supportAllValues: true },
		fontSize: { options: [10, 12, 14, 'default', 18, 20, 22], supportAllValues: true },
		heading: {
			options: [
				{ model: 'paragraph', title: '段落', class: 'ck-heading_paragraph' },
				...[1, 2, 3, 4, 5, 6].map(n => ({ model: `heading${n}`, view: `h${n}`, title: `標題 ${n}`, class: `ck-heading_heading${n}` }))
			]
		},
		pasteFromOffice: { removeStyles: true, removeClasses: true, handleImages: true },
		// allowEmpty：保留 CK4 ckeditorfa 插入的 <i class="fa ..."></i> 空元素
		htmlSupport: { allow: [{ name: /^.*$/, styles: true, attributes: true, classes: true }], allowEmpty: ['i', 'span'] },
		image: {
			toolbar: [
				'toggleImageCaption', 'imageTextAlternative', '|',
				'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
				'resizeImage'
			]
		},
		link: {
			addTargetToExternalLinks: true,
			defaultProtocol: 'https://',
			decorators: {
				toggleDownloadable: { mode: 'manual', label: '下載', attributes: { download: 'file' } }
			}
		},
		list: { properties: { styles: true, startIndex: true, reversed: true } },
		style: { definitions: styleDefinitions },
		table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'] },
		// 同目錄 upload.php：需登入、同站來源，回傳 {url} 符合 SimpleUploadAdapter
		simpleUpload: { uploadUrl }
	}).then(editor => {
		editor.ui.element.after(editor.plugins.get('WordCount').wordCountContainer);
		if (height) {
			editor.ui.element.style.setProperty('--ck5-height', /^\d+$/.test(height) ? `${height}px` : height);
		}
		registerCk4Instance(element, editor);
		return editor;
	});
}

// 讓舊模組的 CKEDITOR.instances.xxx.getData() 與 CKEDITOR.on('instanceReady') 可用
function registerCk4Instance(element, editor) {
	const ck4 = window.CKEDITOR;
	if (!ck4?.fire) {
		return;
	}
	const name = element.id || element.name;
	const instance = ck4.instances[name] = {
		name,
		ck5: editor,
		getData: () => editor.getData(),
		setData: data => editor.setData(data),
		updateElement: () => editor.updateSourceElement(),
		insertHtml: html => editor.model.insertContent(editor.data.toModel(editor.data.processor.toView(html))),
		destroy: () => { delete ck4.instances[name]; return editor.destroy(); }
	};
	ck4.fire('instanceReady', instance);
}

// CKEDITOR.replace(id, config)：把 CK4 設定轉成 CK5（用到 height、toolbar、editorplaceholder、filebrowser、上傳網址）
window.CKEDITOR?._ready?.((el, config = {}) => {
	const element = typeof el === 'string' ? (document.getElementById(el) || document.getElementsByName(el)[0]) : el;
	if (!element) {
		return;
	}
	// 從 CK4 的 elFinder 網址取出 mod_dir、subDir
	const old = config.filebrowserBrowseUrl ? new URL(config.filebrowserBrowseUrl, location.href).searchParams : null;
	const query = old?.get('mod_dir') ? new URLSearchParams({ mod_dir: old.get('mod_dir'), subDir: old.get('subDir') || '' }) : null;
	const upload = query ? new URL(`upload.php?${query}`, import.meta.url).href : undefined;
	return createEditor(element, {
		uploadUrl: upload,
		remoteImageUrl: upload,
		browseUrl: query ? new URL(`browse.php?${query}`, import.meta.url).href : undefined,
		placeholder: config.editorplaceholder || '',
		toolbar: !config.toolbar || config.toolbar === 'my' ? 'full' : 'basic',
		height: config.height ? String(config.height) : undefined
	});
});
