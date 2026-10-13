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

// 取代 elFinder：用原生 <dialog> 開選檔器（見 openBrowser）
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

// 建元素的小工具；檔名、資料夾名可能含任意字元，一律走 textContent / 屬性，不用 innerHTML
const el = (tag, props = {}, ...children) => {
	const node = Object.assign(document.createElement(tag), props);
	node.append(...children);
	return node;
};
const formData = fields => {
	const fd = new FormData();
	Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
	return fd;
};

// 選檔器：子資料夾瀏覽、新增資料夾、上傳（按鈕或拖曳，可多檔）、刪除（模組管理員）、點選插入
function openBrowser(browseUrl, type, title, onPick) {
	const base = new URL(browseUrl, location.href);
	let path = '';
	const endpoint = file => {
		const url = new URL(file, base);
		url.search = base.search;
		url.searchParams.set('type', type);
		url.searchParams.set('path', path);
		return url;
	};

	const status = el('span', { className: 'ck5-browser-status' });
	status.setAttribute('role', 'status');
	const crumbs = el('nav', { className: 'ck5-browser-crumbs', ariaLabel: '目前位置' });
	const fileInput = el('input', { type: 'file', multiple: true, hidden: true, accept: type === 'image' ? 'image/*' : '' });
	const grid = el('div', { className: 'ck5-browser-grid' });
	const dialog = el('dialog', { className: 'ck5-browser', ariaLabel: title },
		el('form', { method: 'dialog', className: 'ck5-browser-header' },
			el('strong', { textContent: title }),
			el('button', { textContent: '×', ariaLabel: '關閉' })),
		el('div', { className: 'ck5-browser-tools' },
			crumbs,
			el('button', { type: 'button', textContent: '＋ 新增資料夾', onclick: mkdir }),
			el('button', { type: 'button', textContent: '⇪ 上傳', onclick: () => fileInput.click() }),
			fileInput, status),
		grid);

	async function request(file, body) {
		const res = await fetch(endpoint(file), body ? { method: 'POST', body } : {})
			.then(r => r.json()).catch(() => ({ error: { message: '連線失敗' } }));
		if (res.error) {
			status.textContent = res.error.message || String(res.error);
		}
		return res;
	}

	async function load(to) {
		path = to;
		status.textContent = '讀取中…';
		render(await request('browse.php'));
	}

	// browse.php 的 GET 與各項 POST 動作都回傳目前資料夾的清單
	function render(res) {
		if (res.error) {
			return false;
		}
		status.textContent = '';
		syncEditors(res.replaced || []);
		const parts = path ? path.split('/') : [];
		crumbs.replaceChildren(el('button', { type: 'button', textContent: '根目錄', onclick: () => load('') }));
		parts.forEach((part, i) => crumbs.append(' / ', el('button', { type: 'button', textContent: part, onclick: () => load(parts.slice(0, i + 1).join('/')) })));

		grid.replaceChildren();
		const action = (text, label, onclick) => el('button', { type: 'button', textContent: text, title: label, ariaLabel: label, onclick });
		const item = (name, isDir, locked, onclick, visual) => {
			const wrap = el('div', { className: 'ck5-browser-item' },
				el('button', { type: 'button', title: name, onclick }, visual, el('span', { textContent: name })));
			if (locked) {
				wrap.append(el('span', { className: 'ck5-browser-lock', textContent: '🔒', title: '模組附件，請到原本的附件功能管理' }));
			} else if (res.can_manage) {
				wrap.append(el('div', { className: 'ck5-browser-actions' },
					action('✏', `改名 ${name}`, () => rename(name, isDir)),
					action('➜', `搬移 ${name}`, () => move(name, isDir)),
					action('×', `刪除 ${name}`, () => remove(name, isDir))));
			}
			grid.append(wrap);
		};
		for (const dir of res.dirs) {
			item(dir, true, false, () => load(path ? `${path}/${dir}` : dir), el('span', { className: 'ck5-browser-icon', textContent: '📁' }));
		}
		for (const f of res.files) {
			const visual = type === 'image'
				? el('img', { src: f.url, alt: '', loading: 'lazy' })
				: el('span', { className: 'ck5-browser-icon', textContent: f.name.split('.').pop().toUpperCase() });
			item(f.name, false, f.locked, () => { dialog.close(); onPick(f.url); }, visual);
		}
		if (!res.dirs.length && !res.files.length) {
			grid.append(el('p', { textContent: '這個資料夾是空的，可按「上傳」或把檔案拖進來' }));
		}
		return true;
	}

	// 改名／搬移後伺服器已更新資料庫；頁面上還沒存檔的編輯內容也要換，否則存檔會把舊網址寫回去
	function syncEditors(pairs) {
		if (!pairs.length) {
			return;
		}
		for (const instance of Object.values(window.CKEDITOR?.instances || {})) {
			const before = instance.getData();
			const after = pairs.reduce((data, [from, to]) => data.split(from).join(to), before);
			if (after !== before) {
				instance.setData(after);
			}
		}
	}

	async function mkdir() {
		const name = prompt('新資料夾名稱（中英文、數字、底線、連字號）');
		if (name) {
			render(await request('browse.php', formData({ op: 'mkdir', name })));
		}
	}

	async function rename(name, isDir) {
		const base = isDir ? name : name.replace(/\.[^.]+$/, '');
		const newName = prompt(`「${name}」的新名稱（中英文、數字、底線、連字號${isDir ? '' : '，副檔名不變'}）\n文章中引用到的網址會一起更新。`, base);
		if (newName && newName !== base) {
			render(await request('browse.php', formData({ op: 'rename', name, new_name: newName })));
		}
	}

	async function move(name, isDir) {
		const res = await request('browse.php', formData({ op: 'tree' }));
		if (res.error) {
			return;
		}
		const self = path ? `${path}/${name}` : name;
		const choices = res.dirs.filter(d => d !== path && !(isDir && (d === self || d.startsWith(`${self}/`))));
		const select = el('select', { ariaLabel: '目的資料夾' },
			...(path ? [el('option', { value: '', textContent: '（根目錄）' })] : []),
			...choices.map(d => el('option', { value: d, textContent: d })));
		if (!select.options.length) {
			status.textContent = '沒有其他資料夾可以搬，請先新增資料夾';
			return;
		}
		const box = el('dialog', { className: 'ck5-browser-move', ariaLabel: `搬移 ${name}` },
			el('form', { method: 'dialog' },
				el('p', { textContent: `把「${name}」搬到：` }),
				select,
				el('p', { className: 'ck5-browser-hint', textContent: '文章中引用到的網址會一起更新。' }),
				el('div', { className: 'ck5-browser-buttons' },
					el('button', { value: 'cancel', textContent: '取消' }),
					el('button', { value: 'ok', textContent: '搬移' }))));
		box.addEventListener('close', async () => {
			box.remove();
			if (box.returnValue === 'ok') {
				render(await request('browse.php', formData({ op: 'move', name, to: select.value })));
			}
		});
		document.body.append(box);
		box.showModal();
	}

	async function remove(name, isDir) {
		const info = await request('browse.php', formData({ op: 'refs', name }));
		if (info.error) {
			return;
		}
		if (info.locked) {
			status.textContent = '這是模組附件（或資料夾內含模組附件），請到原本的附件功能管理';
			return;
		}
		const used = Object.entries(info.refs).map(([table, n]) => `${table}：${n} 筆`);
		const scope = isDir ? '資料夾內的所有檔案會一起刪除。' : '';
		const message = used.length
			? `「${name}」目前被下列資料引用，刪除後這些連結會失效：\n${used.join('\n')}\n\n${scope}確定要刪除嗎？`
			: `確定刪除「${name}」？${scope}刪除後無法復原。`;
		if (confirm(message)) {
			render(await request('browse.php', formData({ op: 'delete', name })));
		}
	}

	async function upload(files) {
		const errors = [];
		let always = null; // 勾了「其餘同名檔案也這樣處理」時記住選擇
		for (const [i, file] of files.entries()) {
			status.textContent = `上傳中 ${i + 1}/${files.length}：${file.name}`;
			let res = await request('upload.php', formData({ upload: file, conflict: 'ask' }));
			if (res.conflict) {
				let choice = always;
				if (!choice || (choice === 'replace' && !res.conflict.can_replace)) {
					[choice, always] = await askConflict(res.conflict, files.length - i > 1);
				}
				if (choice === 'skip') {
					continue;
				}
				res = await request('upload.php', formData({ upload: file, conflict: choice }));
			}
			if (res.error) {
				errors.push(`${file.name}：${res.error.message || res.error}`);
			}
		}
		await load(path);
		status.textContent = errors.join('；');
	}

	// 同名檔案：取代（網址不變，文章連結自動指向新檔）／另存新檔（加編號）／略過；回傳 [選擇, 是否套用到其餘]
	function askConflict({ name, can_replace }, hasMore) {
		return new Promise(resolve => {
			const applyAll = el('input', { type: 'checkbox' });
			const box = el('dialog', { className: 'ck5-browser-move', ariaLabel: '檔名重複' },
				el('form', { method: 'dialog' },
					el('p', { textContent: `這個資料夾已經有「${name}」。` }),
					el('p', { className: 'ck5-browser-hint', textContent: can_replace
						? '取代：舊檔換成新檔，網址不變，已插入文章的連結會直接顯示新檔（瀏覽器可能要重新整理才看得到）。'
						: '只有模組管理員可以取代舊檔，模組附件也不可取代。' }),
					...(hasMore ? [el('label', {}, applyAll, ' 其餘同名檔案也這樣處理')] : []),
					el('div', { className: 'ck5-browser-buttons' },
						el('button', { value: 'skip', textContent: '略過' }),
						el('button', { value: 'rename', textContent: '另存新檔' }),
						...(can_replace ? [el('button', { value: 'replace', textContent: '取代舊檔' })] : []))));
			box.addEventListener('close', () => {
				box.remove();
				const choice = box.returnValue || 'skip'; // Esc 視為略過
				resolve([choice, applyAll.checked ? choice : null]);
			});
			document.body.append(box);
			box.showModal();
		});
	}

	fileInput.addEventListener('change', () => { upload([...fileInput.files]); fileInput.value = ''; });
	dialog.addEventListener('dragover', e => { e.preventDefault(); dialog.classList.add('is-dragover'); });
	dialog.addEventListener('dragleave', () => dialog.classList.remove('is-dragover'));
	dialog.addEventListener('drop', e => {
		e.preventDefault();
		dialog.classList.remove('is-dragover');
		if (e.dataTransfer.files.length) {
			upload([...e.dataTransfer.files]);
		}
	});
	dialog.addEventListener('close', () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	load('');
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
