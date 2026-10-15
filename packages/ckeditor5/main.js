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
	BlockQuote,
	Bold,
	Code,
	CodeBlock,
	Emoji,
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
	Mention,
	Paragraph,
	PasteFromMarkdownExperimental,
	PasteFromOffice,
	PlainTableOutput,
	RemoveFormat,
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
	Collection,
	UIModel,
	addListToDropdown,
	createDropdown,
	toWidget,
	toWidgetEditable,
	IconImage,
	IconLink,
	findAttributeRange,
	plainTextToHtml
} from './ckeditor5.js';

import translations from './translations/zh.js';
import tadZh from './translations/tad-zh.js';
import SourceEditingCodeMirror from './sourceeditingcodemirror.js';

// 自訂介面的語系：原文為英文，zh 查 tad-zh.js；%0、%1 代入參數（同 CK5 的 t()）
// ponytail: 只有繁中與英文，簡中也顯示繁中；要加語言就多一份字典
let lang = 'zh';
const t = (text, ...args) => ((lang === 'zh' && tadZh[text]) || text).replace(/%(\d)/g, (m, i) => args[i] ?? m);

// 照 CK4 config.js 的同名工具列排列（'-' 換行），舊使用者找得到原本的按鈕
// CK4 的 Image、Link 對話框以 imageDialog、linkDialog 對應（內含瀏覽伺服器）；Unlink 在連結的浮動工具列
const justify = ['alignment:left', 'alignment:center', 'alignment:right', 'alignment:justify'];
const toolbars = {
	my: [
		'sourceEditing', '|',
		'undo', 'redo', '|',
		'imageDialog', 'insertTable', 'horizontalLine', 'emoji', 'linkDialog', '|',
		'numberedList', 'bulletedList', 'todoList', 'removeFormat', 'codeBlock', '|',
		'blockQuote', '|',
		'pageBreak', 'columnTemplates',
		'-',
		'style', 'heading', 'fontFamilyText', 'fontSizeText', '|',
		'fontColor', 'fontBackgroundColor', 'highlight', 'bold', 'italic', 'underline', 'strikethrough', '|',
		'outdent', 'indent', '|',
		...justify, '|',
		'findAndReplace', 'selectAll', 'fontAwesome'
	],
	myBasic: [
		'sourceEditing', 'style', 'heading', 'fontSizeText', 'fontColor', 'fontBackgroundColor', 'bold', 'italic', '|',
		'numberedList', 'bulletedList', 'outdent', 'indent', '|',
		'linkDialog', 'removeFormat', '|',
		...justify, '|',
		'insertTable'
	],
	tadBasic: [
		'sourceEditing', 'heading', 'fontSizeText', 'fontColor', 'fontBackgroundColor', 'bold', 'italic', '|',
		'numberedList', 'bulletedList', 'outdent', 'indent', '|',
		'linkDialog', '|',
		...justify, '|',
		'insertTable', 'undo', 'redo'
	],
	mySimple: [
		'sourceEditing', '|',
		'undo', 'redo', '|',
		'imageDialog', 'insertTable', 'horizontalLine', 'linkDialog', '|',
		'numberedList', 'bulletedList', 'removeFormat', '|', 'outdent', 'indent',
		'-',
		'style', 'heading', 'fontSizeText', 'fontColor', 'fontBackgroundColor', 'bold', 'italic', 'underline', 'strikethrough', '|',
		'alignment:left', 'alignment:center', 'alignment:right'
	],
	tadSimple: [
		'imageDialog', 'insertTable', 'linkDialog', '|',
		'fontSizeText', 'fontColor', 'fontBackgroundColor', 'bold', 'italic', 'underline', 'strikethrough', '|',
		'alignment:left', 'alignment:center', 'alignment:right', '|',
		'numberedList', 'bulletedList', 'outdent', 'indent', '|', 'removeFormat'
	]
};

// 對應 CK4 fontSize_sizes：選單顯示 8～30，內容存成 rem（舊文章的 rem 字級也能對上）
const fontSizeOptions = ['default', ...[8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map(px => {
	const rem = `${+(px / 12).toFixed(3)}rem`;
	return { title: String(px), model: rem, view: { name: 'span', styles: { 'font-size': rem }, priority: 7 } };
})];

// 對應 CK4 CkEditor::getStyle()（只支援 class）；陰影標題見 TextShadowStyle，自適應圖片在影像對話框，「語法」用 Ctrl+E 或 `文字`
// 新內容只輸出 Bootstrap 5 class；舊文章的 BS3/4 class 由 GeneralHtmlSupport 原樣保留
const styleDefinitions = () => [
	[t('Shadow heading h2'), 'h2', 'ck5-text-shadow'],
	[t('Shadow heading h3'), 'h3', 'ck5-text-shadow'],
	[t('Info alert'), 'div', 'alert alert-info'],
	[t('Success alert'), 'div', 'alert alert-success'],
	[t('Warning alert'), 'div', 'alert alert-warning'],
	[t('Danger alert'), 'div', 'alert alert-danger'],
	[t('Official numbering (一、(一)、１)'), 'ol', 'paper-list'],
	[t('Nested list (1. (1) A.)'), 'ol', 'my-list'],
	[t('List (壹、貳)'), 'ol', 'big-tw'],
	[t('List (一、二)'), 'ol', 'small-tw'],
	[t('List ((一)、(二))'), 'ol', 'brackets-tw'],
	[t('List (1. 2.)'), 'ol', 'dot-num'],
	[t('List ((1) (2))'), 'ol', 'brackets-num'],
	...['secondary', 'primary', 'success', 'info', 'warning', 'danger', 'light', 'dark']
		.map(c => [t('%0 badge', `${c[0].toUpperCase()}${c.slice(1)}`), 'span', `badge text-bg-${c}`]),
	[t('Keyboard key'), 'kbd', 'kbd']
].map(([name, element, cls]) => ({ name, element, classes: cls.split(' ') }));

// 對應 CK4 config.js 的 font_names（「顯示名稱/字型」），@font-face 在 fonts.css
const fontFamilyOptions = ['default', ...'851電機文字/851DianJiWenZiTi;莫大毛筆字體/Bakudai;波塔/BoTa;源流注音明體-粗體/BpmfGenRyuMin-B;源流注音明體/BpmfGenRyuMin-R;源石注音黑體-粗體/BpmfGenSekiGothic-B;源石注音黑體/BpmfGenSekiGothic-R;源泉注音圓體-粗體/BpmfGenSenRounded-B;源泉注音圓體/BpmfGenSenRounded-R;源雲注音明體/BpmfGenWanMin-R;源樣注音黑體-粗體/BpmfGenYoGothic-B;源樣注音黑體/BpmfGenYoGothic-R;源樣注音明體-粗體/BpmfGenYoMin-B;源樣注音明體/BpmfGenYoMin-R;字嗨注音標楷/BpmfZihiKaiStd-Regular;字嗨注音黑體-粗體/BpmfZihiSans-Bold;字嗨注音黑體/BpmfZihiSans-Regular;字嗨注音宋體-粗體/BpmfZihiSerif-Bold;字嗨注音宋體/BpmfZihiSerif-Regular;粉筆體/Chalk;超級細ゴシック體/ChaoJiXi;公司LOGO圓體/CorpRound;黑板粉筆體/Crayon;俐方體11號/Cubic;豆豆體/Doudouziti;王漢宗中仿宋/HanWangFangSongMedium;王漢宗特黑體/HanWangHeiHeavy;王漢宗細黑體/HanWangHeiLight;王漢宗中楷注音/HanWangKaiMediumChuIn;王漢宗勘亭流/HanWangKanTan;王漢宗中隸書/HanWangLiSuMedium;王漢宗超明體/HanWangMingBlack;王漢宗魏碑體/HanWangWeBe;王漢宗特圓體/HanWangYenHeavy;王漢宗細圓體/HanWangYenLight;王漢宗綜藝體/HanWangZonYi;漢字筆順體原版/HanZiBiShunZiTi;衡山毛筆草書/HengShanMaoBiCaoShu;刻石錄顏體/I-Ngaan;刻石錄鋼筆鶴體/I-PenCrane-B;芫荽體/Iansui;清松手寫體1/JasonHandwriting1;清松手寫體2/JasonHandwriting2;清松手寫體3/JasonHandwriting3;清松手寫體4/JasonHandwriting4;jf open 粉圓體/JfOpenhuninn;解星 B/KaiseiTokumin;荊南麥圓體/KingnamMaiyuan;苦累蛙圓體/Kurewa;Mamelon字體/Mamelon;Mamelon新版字體/MamelonHi;正風毛筆字體（衡山毛筆行書）/MasaFont;內海字體/NaikaiFont;馬克筆手寫/NishikiTeki;胖胖豬肉體/PangPangZhuRouTi;破碎零號字/PoSuiLingHaoZi;大波浪圓體/PopGothicCjkJp;千圖馬克手寫體/QianTuMaKeShouXieTi;黒薔薇/Qiang;青柳隷書/QingLiuShu;隨峰體/SuiFengTi;獅尾詠腿黑體/SweiFistLegCJKjp;獅尾四季春/SweiSpringSugarCJKtc;獅尾牙膏圓體/SweiToothpasteCJKtc;糖果手寫粗體/TanugoTangGuoShouXieTiBold;糖果手寫體/TanugoTangGuoShouXieTiRegular;たぬき油性マジック/Tanukimagic;鵪鶉字體/UzuraZiTi;無心手寫體/WuXinShouXieTi;賢二體/XianErTi;字體圈欣意冠黑體/XinYiGuanHeiTi;YOz手寫體/YOzShouXieTi;英椎行書/YingZhuiXingShu;佑字/YouZi;源影黑體/YuanYingHeiTi;宅在家粉條甜/ZhaiZaiJiaFenTiaoTian;宅在家麥克筆/ZhaiZaiJiaMaiKeBi;宅在家自動筆/ZhaiZaiJiaZiDongBi;佐佐木字體/ZuoZuoMuZiTi'
	.split(';').map(item => {
		const [title, font] = item.split('/');
		return { title, model: font, view: { name: 'span', styles: { 'font-family': font }, priority: 7 } };
	})];

// CK5 的字型、大小預設只有圖示，改成像 CK4 顯示文字（目前套用的字型名稱）
function TextDropdowns(editor) {
	const titles = Object.fromEntries(fontFamilyOptions.filter(o => o.model).map(o => [o.model, o.title]));
	const sizes = Object.fromEntries(fontSizeOptions.filter(o => o.model).map(o => [o.model, o.title]));
	[['fontFamily', t('Font'), v => titles[v] || v.split(',')[0].replace(/["']/g, '')], ['fontSize', t('Size'), v => sizes[v] || v]].forEach(([name, label, format]) => {
		editor.ui.componentFactory.add(`${name}Text`, () => {
			const dropdown = editor.ui.componentFactory.create(name);
			dropdown.buttonView.set({ withText: true, icon: undefined });
			dropdown.buttonView.bind('label').to(editor.commands.get(name), 'value', v => v ? format(String(v)) : label);
			dropdown.extendTemplate({ attributes: { class: 'ck5-text-dropdown' } });
			return dropdown;
		});
	});
}

// 取代 CK4 widgetbootstrap／widgettemplatemenu：插入同樣的 Bootstrap 多欄 HTML，舊文章的版型也能照常編輯
// 版型是 widget（同 CK4）：點外框可整組選取、按 Delete 整組刪除，各欄內容可直接編輯
// 各欄只放文字，不預插佔位圖
const column = (cls, text) => `<div class="${cls}"><p>${text}</p></div>`;
const columnTemplates = () => {
	const columns = n => Array.from({ length: n }, () => column(`col-sm-${12 / n}`, n === 2 ? t('Enter content') : t('Enter text'))).join('');
	const sidebar = column('col-sm-4', t('Enter content'));
	const main = column('col-sm-8', t('Enter content'));
	return [
		[t('Add 1:2 two columns'), `<div class="row">${sidebar}${main}</div>`],
		[t('Add 2:1 two columns'), `<div class="row">${main}${sidebar}</div>`],
		...[2, 3, 4, 6].map(n => [t('Add %0 columns', n), `<div class="row">${columns(n)}</div>`])
	];
};
const IconColumns = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2 3h4.5v14H2zm5.75 0h4.5v14h-4.5zM13.5 3H18v14h-4.5z"/></svg>';

// 視為版型的 div.row：帶 CK4 舊版型 class，或子元素全是 col-* 欄位；其他 div 仍交給 GeneralHtmlSupport
const ROW_CLASSES = ['two-col-left', 'two-col-right', 'two-col', 'three-col', 'four-col', 'six-col'];
const isCol = v => v.is('element', 'div') && [...v.getClassNames()].some(c => /^col(-|$)/.test(c));
const isRow = v => {
	if (!v?.is?.('element', 'div') || !v.hasClass('row')) {
		return false;
	}
	const children = [...v.getChildren()].filter(c => c.is('element'));
	return ROW_CLASSES.some(c => v.hasClass(c)) || (children.length > 0 && children.every(isCol));
};

function ColumnWidget(editor) {
	const { schema } = editor.model;
	const { conversion } = editor;
	schema.register('bsRow', { inheritAllFrom: '$blockObject', allowAttributes: ['htmlAttrs'] });
	schema.register('bsCol', { allowIn: 'bsRow', allowContentOf: '$root', isLimit: true, allowAttributes: ['htmlAttrs'] });

	// div 的所有屬性（class、style、id…）原樣存起來，輸出時還原
	[['bsRow', isRow], ['bsCol', v => isRow(v.parent)]].forEach(([name, match]) => {
		conversion.for('upcast').add(dispatcher => dispatcher.on('element:div', (evt, data, api) => {
			const view = data.viewItem;
			if (!match(view) || !api.consumable.test(view, { name: true })) {
				return;
			}
			const element = api.writer.createElement(name, { htmlAttrs: Object.fromEntries(view.getAttributes()) });
			if (!api.safeInsert(element, data.modelCursor)) {
				return;
			}
			api.consumable.consume(view, { name: true });
			api.convertChildren(view, element);
			api.updateConversionResult(element, data);
		}, { priority: 'high' }));
	});
	const attrs = model => model.getAttribute('htmlAttrs') || {};
	conversion.for('dataDowncast').elementToElement({ model: 'bsRow', view: (m, { writer }) => writer.createContainerElement('div', attrs(m)) });
	conversion.for('dataDowncast').elementToElement({ model: 'bsCol', view: (m, { writer }) => writer.createContainerElement('div', attrs(m)) });
	conversion.for('editingDowncast').elementToElement({
		model: 'bsRow',
		view: (m, { writer }) => toWidget(writer.createContainerElement('div', attrs(m)), writer, { label: t('Column layout'), hasSelectionHandle: true })
	});
	conversion.for('editingDowncast').elementToElement({
		model: 'bsCol',
		view: (m, { writer }) => toWidgetEditable(writer.createEditableElement('div', attrs(m)), writer)
	});
}

// 載入舊內容時清成 Bootstrap 5：拿掉 CK4 版型留下的佔位圖、two-col／span6／coln-1 等舊 class，img-responsive 換成 img-fluid
// ponytail: 只處理字串內容（setData／初始內容）；整頁模式（含 <html>）不處理
function cleanLegacyHtml(html) {
	if (/<html/i.test(html) || !/fakeimg\.pl|img-responsive|class="[^"]*\b(span\d+|coln-\d+|(two|three|four|six)-col)\b/.test(html)) {
		return html;
	}
	const t = document.createElement('template');
	t.innerHTML = html;
	t.content.querySelectorAll('img[src*="fakeimg.pl"]').forEach(img => {
		const p = img.parentElement;
		img.remove();
		if (p?.matches('p') && !p.textContent.trim() && !p.children.length) {
			p.remove();
		}
	});
	t.content.querySelectorAll('img.img-responsive').forEach(img => img.classList.replace('img-responsive', 'img-fluid'));
	t.content.querySelectorAll(ROW_CLASSES.map(c => `div.row.${c}, div.row.${c} > div`).join(',')).forEach(div => {
		div.classList.remove(...ROW_CLASSES, ...[...div.classList].filter(c => /^(span\d+|coln-\d+)$/.test(c)));
	});
	return t.innerHTML;
}
function CleanLegacyHtml(editor) {
	const { processor } = editor.data;
	const toView = processor.toView.bind(processor);
	processor.toView = html => toView(cleanLegacyHtml(html));
}

// CK4「陰影標題」是 inline style，CK5 樣式只能套 class：編輯時用 ck5-text-shadow，存檔換回同樣的 inline style，前台不需額外 CSS
const SHADOW = '1px 1px 1px #aaaaaa';
function TextShadowStyle(editor) {
	const { processor } = editor.data;
	const toView = processor.toView.bind(processor);
	const toData = processor.toData.bind(processor);
	const probe = document.createElement('span').style;
	probe.textShadow = SHADOW;
	const convert = (html, test, fix) => {
		if (/<html/i.test(html) || !test.test(html)) {
			return html;
		}
		const t = document.createElement('template');
		t.innerHTML = html;
		t.content.querySelectorAll('h2, h3').forEach(fix);
		return t.innerHTML;
	};
	processor.toView = html => toView(convert(html, /text-shadow/, h => {
		if (h.style.textShadow === probe.textShadow) {
			h.style.removeProperty('text-shadow');
			h.style.length || h.removeAttribute('style');
			h.classList.add('ck5-text-shadow');
		}
	}));
	processor.toData = fragment => convert(toData(fragment), /ck5-text-shadow/, h => {
		if (h.classList.contains('ck5-text-shadow')) {
			h.classList.remove('ck5-text-shadow');
			h.classList.length || h.removeAttribute('class');
			h.style.textShadow = SHADOW;
		}
	});
}

// 「語法」（行內 code）不放工具列：Ctrl+E（同 Notion），或 Autoformat 打 `文字`
function CodeShortcut(editor) {
	editor.keystrokes.set('Ctrl+E', 'code');
}

function ColumnTemplates(editor) {
	editor.ui.componentFactory.add('columnTemplates', locale => {
		const dropdown = createDropdown(locale);
		dropdown.buttonView.set({ label: t('Insert column layout'), icon: IconColumns, tooltip: true });
		const items = new Collection();
		columnTemplates().forEach(([label, html]) => items.add({ type: 'button', model: new UIModel({ label, html, withText: true }) }));
		addListToDropdown(dropdown, items);
		dropdown.on('execute', evt => insertHtml(editor, evt.source.html));
		return dropdown;
	});
}

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

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;

// 取代 CK4 影像屬性對話框：影像資訊／連結／進階，雙擊圖片可修改
// 一律輸出 <a><img style="..."></a> 行內圖片（同 CK4），其餘屬性交給 GeneralHtmlSupport 保留
// ponytail: 修改區塊圖片時會轉成行內圖片，圖說（figcaption）不保留
function ImageDialog(editor) {
	const open = () => openImageDialog(editor);
	editor.ui.componentFactory.add('imageDialog', locale => {
		const button = new ButtonView(locale);
		button.set({ label: t('Image'), icon: IconImage, tooltip: true });
		button.on('execute', open);
		return button;
	});
	editor.ui.on('ready', () => editor.ui.getEditableElement()?.addEventListener('dblclick', e => {
		if (e.target.closest('img')) {
			open();
		}
	}));
	// 拖放／貼上上傳的圖片不經對話框，上傳完成時同樣加上自適應
	editor.plugins.get('ImageUploadEditing').on('uploadComplete', (evt, { imageElement }) => {
		const attrs = imageElement.getAttribute('htmlImgAttributes') || {};
		editor.model.change(writer => writer.setAttribute('htmlImgAttributes', {
			...attrs,
			classes: [...new Set([...(attrs.classes || []), 'img-fluid'])],
			styles: { ...attrs.styles, height: 'auto' }
		}, imageElement));
	});
}

// 目前選取的圖片轉成 HTML 再解析，取得 img、外層 a 與 figure
function selectedImage(editor) {
	const { model } = editor;
	const element = model.document.selection.getSelectedElement();
	if (!element?.is('element', 'imageInline') && !element?.is('element', 'imageBlock')) {
		return {};
	}
	const doc = new DOMParser().parseFromString(editor.data.stringify(model.getSelectedContent(model.document.selection)), 'text/html');
	return { img: doc.querySelector('img'), a: doc.querySelector('a'), figure: doc.querySelector('figure') };
}

const NUMBER = /^\d+(\.\d+)?$/;

function openImageDialog(editor) {
	const { browseUrl } = editor.config.get('tad') || {};
	const { img, a, figure } = selectedImage(editor);

	// 拆出 CK4 對話框各欄位對應的樣式，剩下的放到「進階／樣式」
	const css = document.createElement('span').style;
	css.cssText = img?.getAttribute('style') || '';
	const take = prop => {
		const v = css.getPropertyValue(prop);
		css.removeProperty(prop);
		return v;
	};
	const takePair = (p1, p2) => css.getPropertyValue(p1) === css.getPropertyValue(p2) ? (take(p2), take(p1)) : '';
	const num = v => (v || '').replace(/px$/, '');
	const initial = {
		width: num(take('width') || figure?.style.width || img?.getAttribute('width')),
		height: num(take('height') || img?.getAttribute('height')),
		border: css.getPropertyValue('border-style') === 'solid' ? (take('border-style'), num(take('border-width'))) : '',
		hspace: num(takePair('margin-left', 'margin-right')),
		vspace: num(takePair('margin-top', 'margin-bottom')),
		align: take('float')
	};
	// CK4 樣式「自適應圖片／圖框」改成對話框選單；有 img-fluid 才把 img-thumbnail 算進選單
	const classes = (img?.getAttribute('class') || '').split(/\s+/).filter(Boolean);
	const fluid = classes.includes('img-fluid');
	// 新插入的圖片預設自適應，手機不會被大圖撐破
	const responsive = !img ? 'img-fluid' : fluid ? (classes.includes('img-thumbnail') ? 'img-fluid img-thumbnail' : 'img-fluid') : '';

	const browseButton = target => browseFor(browseUrl, target);

	const f = {
		src: input(img?.getAttribute('src'), { placeholder: t('Enter the image URL...'), className: 'font-mono' }),
		alt: input(img?.getAttribute('alt'), { placeholder: t('Text shown to visually impaired users or when the image cannot be displayed') }),
		width: input(initial.width, { size: 5, className: 'text-center font-medium' }),
		height: input(initial.height, { size: 5, className: 'text-center font-medium' }),
		border: input(initial.border, { placeholder: t('e.g. 0 or 1px solid #ccc') }),
		hspace: input(initial.hspace, { placeholder: '0', className: 'text-center' }),
		vspace: input(initial.vspace, { placeholder: '0', className: 'text-center' }),
		align: select(initial.align, [['', t('<not set>')], ['left', t('Left')], ['center', t('Center')], ['right', t('Right')]]),
		responsive: select(responsive, [['', t('<not set>')], ['img-fluid', t('Responsive image (img-fluid)')], ['img-fluid img-thumbnail', t('Responsive thumbnail (img-thumbnail)')]]),
		className: input(classes.filter(c => !fluid || !['img-fluid', 'img-thumbnail'].includes(c)).join(' '), { className: 'font-mono' }),
		title: input(img?.getAttribute('title')),
		style: input(css.cssText, { className: 'font-mono' })
	};

	// 依欄位組出 <img>；預覽與確定共用
	const unit = v => NUMBER.test(v.trim()) ? `${v.trim()}px` : v.trim();
	function buildImage() {
		const style = document.createElement('span').style;
		style.cssText = f.style.value;
		const set = (prop, v) => v.trim() && style.setProperty(prop, unit(v));
		set('width', f.width.value);
		// 自適應時高度一律 auto（同 CK4），否則固定高度會讓縮小後的圖片變形
		f.responsive.value ? style.setProperty('height', 'auto') : set('height', f.height.value);
		if (f.border.value.trim()) {
			set('border-width', f.border.value);
			style.setProperty('border-style', 'solid');
		}
		['margin-left', 'margin-right'].forEach(p => set(p, f.hspace.value));
		['margin-top', 'margin-bottom'].forEach(p => set(p, f.vspace.value));
		if (f.align.value === 'center') {
			style.setProperty('display', 'block');
			style.setProperty('margin-left', 'auto');
			style.setProperty('margin-right', 'auto');
		} else if (f.align.value) {
			style.setProperty('float', f.align.value);
		}
		const image = document.createElement('img');
		image.setAttribute('src', f.src.value.trim());
		image.setAttribute('alt', f.alt.value.trim());
		// 對話框已不提供的屬性沿用原圖，避免修改時遺失
		['id', 'dir', 'lang', 'longdesc'].forEach(name => img?.hasAttribute(name) && image.setAttribute(name, img.getAttribute(name)));
		const cls = `${f.responsive.value} ${f.className.value}`.trim();
		cls && image.setAttribute('class', cls);
		f.title.value.trim() && image.setAttribute('title', f.title.value.trim());
		if (style.cssText) {
			image.setAttribute('style', style.cssText);
		}
		return image;
	}

	// 鎖定比例、重設為原始大小，依圖片實際尺寸計算
	let natural = null;
	let locked = true;
	const lock = el('button', { type: 'button', className: 'ck5-image-icon ck5-lock-btn', title: t('Lock aspect ratio'), ariaLabel: t('Lock aspect ratio') },
		svgIcon('M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'));
	lock.onclick = () => {
		locked = !locked;
		lock.replaceChildren(svgIcon(locked
			? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
			: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'));
		lock.classList.toggle('is-unlocked', !locked);
	};
	const reset = el('button', { type: 'button', className: 'ck5-image-icon ck5-reset-btn', title: t('Reset to original size'), ariaLabel: t('Reset to original size') },
		svgIcon('M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'));
	reset.onclick = () => {
		if (natural) {
			f.width.value = natural.w;
			f.height.value = natural.h;
			update();
		}
	};
	const keepRatio = (from, to, a, b) => {
		if (locked && natural && NUMBER.test(from.value.trim())) {
			to.value = Math.round(parseFloat(from.value) * natural[b] / natural[a]);
		}
	};
	f.width.addEventListener('input', () => keepRatio(f.width, f.height, 'w', 'h'));
	f.height.addEventListener('input', () => keepRatio(f.height, f.width, 'h', 'w'));

	const loadNatural = () => {
		natural = null;
		const probe = new Image();
		probe.onload = () => { natural = { w: probe.naturalWidth, h: probe.naturalHeight }; };
		probe.src = f.src.value.trim();
	};
	f.src.addEventListener('input', loadNatural);
	loadNatural();

	const preview = el('div', { className: 'ck5-image-preview bg-checker' });
	function update() {
		const imgNode = f.src.value.trim() ? buildImage() : null;
		preview.replaceChildren(
			el('div', { className: 'ck5-preview-card' },
				...(imgNode ? [imgNode] : [
					el('div', { className: 'ck5-preview-empty' },
						svgIcon('M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', 32, 32),
						el('span', { textContent: t('No image selected') }))
				]),
				el('div', { className: 'ck5-preview-text' }, t('This is sample text for previewing image alignment, border and spacing. ').repeat(4))),
			el('div', { className: 'ck5-preview-badge' }, el('span', { textContent: t('Live preview') }))
		);
	}

	const urlField = el('div', { className: 'ck5-image-field' },
		el('div', { className: 'ck5-image-label-row' },
			el('span', { innerHTML: 'URL <span class="ck5-required">*</span>' }),
			el('span', { className: 'ck5-image-hint', textContent: t('Supports JPG, PNG, GIF') })),
		f.src);

	const imagePanel = el('div', { className: 'ck5-image-panel', role: 'tabpanel' },
		el('div', { className: 'ck5-image-row' }, urlField, browseButton(f.src)),
		field(t('Alternative text'), f.alt),
		el('div', { className: 'ck5-image-columns' },
			el('div', { className: 'ck5-image-sizes' },
				el('div', { className: 'ck5-image-field' },
					el('span', { textContent: t('Width') }),
					el('div', { className: 'ck5-image-row' }, f.width, lock, reset)),
				field(t('Height'), f.height),
				el('div', { className: 'ck5-image-subgrid' },
					field('HSpace', f.hspace),
					field('VSpace', f.vspace))),
			el('div', { className: 'ck5-image-field ck5-image-preview-wrap' },
				el('span', { textContent: t('Preview') }),
				preview)),
		el('div', { className: 'ck5-image-grid' }, field(t('Border'), f.border), field(t('Alignment'), f.align), field(t('Responsive'), f.responsive)),
		cssSection(f, t('Image properties')));

	// 「連結」頁籤與連結對話框相同，只是沒有顯示文字（內容就是圖片）
	const link = linkFields(a);
	link.protocolRow.append(browseFor(browseUrl, link.url, 'file'));
	const linkPanel = el('div', { className: 'ck5-image-panel', role: 'tabpanel' }, link.protocolRow, ...link.sections);

	const panels = [imagePanel, linkPanel];
	const tabs = [t('Image info'), t('Link')].map((text, i) => el('button', {
		type: 'button', textContent: text, role: 'tab',
		onclick: () => show(i)
	}));
	function show(index) {
		tabs.forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)));
		panels.forEach((panel, i) => { panel.hidden = i !== index; });
	}
	show(0);

	const dialog = formDialog(t('Image properties'), el('div', {}, ...panels), () => !f.src.value.trim() && (show(0), f.src), () => {
		let node = buildImage();
		if (link.href()) {
			const anchor = link.build();
			anchor.append(node);
			node = anchor;
		}
		insertHtml(editor, node.outerHTML);
	});
	dialog.querySelector('.ck5-browser-header strong')
		.after(el('div', { className: 'ck5-browser-tabs', role: 'tablist', ariaLabel: t('Image properties') }, ...tabs));
	dialog.addEventListener('input', update);
	dialog.addEventListener('change', update);
	update();
	f.src.focus();
}

// SVG 圖示小工具
const svgIcon = (d, w = 16, h = 16, vb = '0 0 24 24') => {
	const span = el('span', { className: 'ck5-svg' });
	span.innerHTML = `<svg width="${w}" height="${h}" fill="none" stroke="currentColor" viewBox="${vb}"><path d="${d}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`;
	return span;
};

// 仿 CK4 對話框共用的欄位與外框
const input = (value, props = {}) => el('input', { type: 'text', value: value || '', ...props });
const select = (value, options) => {
	const node = el('select', {}, ...options.map(([v, text]) => el('option', { value: v, textContent: text })));
	node.value = value || '';
	return node;
};
// 勾「開新視窗」用 _blank；沒勾時保留舊連結原有的其他目標（_top、框架名稱等）
const keepTarget = (a, blank) => {
	const old = a?.getAttribute('target') || '';
	return blank ? '_blank' : old === '_blank' ? '' : old;
};
const field = (label, control) => el('label', { className: 'ck5-image-field' }, el('span', { textContent: label }), control);
const browseFor = (browseUrl, target, startType = 'image') => browseUrl
	? el('button', {
		type: 'button', className: 'ck5-btn-browse',
		onclick: () => openBrowser(browseUrl, t('Browse and upload'), url => {
			target.value = url;
			target.dispatchEvent(new Event('input', { bubbles: true }));
		}, startType)
	},
	svgIcon('M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'),
	el('span', { textContent: t('Browse and upload') }))
	: '';
const insertHtml = (editor, html) => {
	editor.model.insertContent(editor.data.toModel(editor.data.processor.toView(html)));
	editor.editing.view.focus();
};
// 標題、class、style 三欄，影像與連結共用
const cssSection = (f, legend = t('Link attributes')) => el('fieldset', {}, el('legend', { textContent: legend }),
	el('div', { className: 'ck5-image-grid' }, field(t('Title'), f.title), field(t('Class'), f.className), field(t('Style'), f.style)));

// 連結欄位（通訊協定＋URL、目標、CSS 樣式表），連結對話框與影像的「連結」頁籤共用
function linkFields(a) {
	// 拆解舊網址；mailto:、tel:、# 等歸到 <其他>，整串放在 URL 欄
	const href = a?.getAttribute('href') || '';
	const proto = PROTOCOLS.find(p => href.toLowerCase().startsWith(p)) ?? (href ? '' : 'https://');
	const f = {
		protocol: select(proto, [...PROTOCOLS.map(p => [p, p]), ['', t('<other>')]]),
		url: input(href.slice(proto.length)),
		blank: el('input', { type: 'checkbox', checked: a?.getAttribute('target') === '_blank' }),
		title: input(a?.getAttribute('title')),
		className: input(a?.getAttribute('class')),
		style: input(a?.getAttribute('style'))
	};
	// 瀏覽選到完整網址時，自動拆出通訊協定
	f.url.addEventListener('input', () => {
		const p = PROTOCOLS.find(p => f.url.value.toLowerCase().startsWith(p));
		if (p) {
			f.protocol.value = p;
			f.url.value = f.url.value.slice(p.length);
		} else if (f.url.value.startsWith('/')) {
			f.protocol.value = '';
		}
	});
	const buildHref = () => f.url.value.trim() && f.protocol.value + f.url.value.trim();
	return {
		url: f.url,
		href: buildHref,
		protocolRow: el('div', { className: 'ck5-image-row ck5-link-protocol' }, field(t('Protocol'), f.protocol), field('URL *', f.url)),
		sections: [
			el('fieldset', {}, el('legend', { textContent: t('Target') }), el('label', { className: 'ck5-link-check' }, f.blank, t('Open in a new window'))),
			cssSection(f)
		],
		build() {
			const link = document.createElement('a');
			// 對話框已不提供的屬性（id、rel、download…）沿用舊連結，避免修改時遺失
			[...(a?.attributes || [])].forEach(({ name, value }) => !['href', 'target', 'title', 'class', 'style'].includes(name) && link.setAttribute(name, value));
			link.setAttribute('href', buildHref());
			const target = keepTarget(a, f.blank.checked);
			target && link.setAttribute('target', target);
			[['title', f.title], ['class', f.className], ['style', f.style]]
				.forEach(([attr, node]) => node.value.trim() && link.setAttribute(attr, node.value.trim()));
			return link;
		}
	};
}

// 單頁對話框：invalid() 回傳要聚焦的欄位時阻止送出；按確定才呼叫 onOk
function formDialog(title, panel, invalid, onOk) {
	const ok = el('button', { value: 'ok', textContent: t('OK') });
	ok.addEventListener('click', e => {
		const error = invalid();
		if (error) {
			e.preventDefault();
			error.focus();
		}
	});
	const dialog = el('dialog', { className: 'ck5-browser ck5-image-dialog', ariaLabel: title },
		el('form', { method: 'dialog' },
			el('div', { className: 'ck5-browser-header' },
				el('strong', { textContent: title }),
				el('button', { value: 'cancel', className: 'ck5-btn-close', ariaLabel: t('Close') },
					svgIcon('M6 18L18 6M6 6l12 12', 18, 18))),
			panel,
			el('div', { className: 'ck5-browser-buttons ck5-image-footer' },
				el('button', { value: 'cancel', textContent: t('Cancel') }),
				ok)));
	dialog.addEventListener('close', () => {
		dialog.remove();
		if (dialog.returnValue === 'ok') {
			onOk();
		}
	});
	document.body.append(dialog);
	dialog.showModal();
	return dialog;
}


// 取代 CK4 連結對話框：只提供網址（mailto:、tel:、# 選 <其他> 直接打），雙擊連結可修改
// ponytail: 目標不提供 CK4 的「快顯視窗」（要產生 onclick 的 window.open）
const PROTOCOLS = ['http://', 'https://', 'ftp://', 'news://'];
const BLOCKS = 'p, div, h1, h2, h3, h4, h5, h6, ul, ol, li, table, figure, blockquote, pre, hr';

function LinkDialog(editor) {
	const open = () => openLinkDialog(editor);
	editor.ui.componentFactory.add('linkDialog', locale => {
		const button = new ButtonView(locale);
		button.set({ label: t('Link'), icon: IconLink, tooltip: true });
		button.on('execute', open);
		return button;
	});
	editor.ui.on('ready', () => editor.ui.getEditableElement()?.addEventListener('dblclick', e => {
		if (e.target.closest('a') && !e.target.closest('img')) {
			open();
		}
	}));
}

// 游標所在的整段連結（或目前選取範圍）轉成 HTML 解析；回傳範圍、<a> 與選取內容
function selectedLink(editor) {
	const { model } = editor;
	const selection = model.document.selection;
	const href = selection.getAttribute('linkHref');
	const range = href && selection.isCollapsed
		? findAttributeRange(selection.getFirstPosition(), 'linkHref', href, model)
		: selection.getFirstRange();
	const html = editor.data.stringify(model.getSelectedContent(model.createSelection(range)));
	const body = new DOMParser().parseFromString(html, 'text/html').body;
	// 只選在單一段落內時才能包成 <a>；跨段落交給 CK5 link 指令
	const blocks = [...body.children].filter(node => node.matches(BLOCKS));
	const inline = !blocks.length ? body : body.children.length === 1 && blocks[0].matches('p') ? blocks[0] : null;
	return { range, a: href ? body.querySelector('a') : null, inline };
}

function openLinkDialog(editor) {
	const { browseUrl } = editor.config.get('tad') || {};
	const { range, a, inline } = selectedLink(editor);
	const originalText = (inline?.textContent || '').trim();
	const textInput = input(originalText);
	const fields = linkFields(a);

	const panel = el('div', { className: 'ck5-image-panel ck5-link-panel' },
		el('div', { className: 'ck5-image-row' }, field(t('Display text'), textInput), browseFor(browseUrl, fields.url, 'file')),
		fields.protocolRow, ...fields.sections);

	formDialog(t('Link'), panel, () => !fields.href() && fields.url, () => {
		const link = fields.build();

		// 顯示文字沒改就保留原本內容（粗體等格式）；改了或原本沒選文字就用新文字
		const text = textInput.value.trim();
		if (!inline && !text) {
			// 跨段落選取：只能套網址
			editor.execute('link', link.getAttribute('href'));
			return editor.editing.view.focus();
		}
		if (inline && text === originalText) {
			const old = inline.querySelector('a');
			link.innerHTML = old && old.parentNode === inline && inline.childNodes.length === 1 ? old.innerHTML : inline.innerHTML;
		} else {
			link.textContent = text || link.getAttribute('href').replace(/^mailto:|^tel:/, '');
		}
		editor.model.change(writer => writer.setSelection(range));
		insertHtml(editor, link.outerHTML);
	});
	textInput.focus();
}

// 取代 CK4 ckeditorfa：插入 <span class="fa-solid fa-xxx"></span>，格式與舊文章相同
// 圖示清單（Solid 免費版、Brands）複製自 tadtools/fontawesome6-picker，放在 packages/fontawesome6
// ponytail: 不做 widget，插入後要改就刪掉重插；不提供 Regular（免費版只有少數圖示）
const FA_LIST_URL = new URL('../fontawesome6/', import.meta.url);
const IconFontAwesome = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M4 2h1.5v16H4zM6.5 3h10l-2.5 3.5 2.5 3.5h-10z"/></svg>';
let faLists;

function FontAwesome(editor) {
	editor.ui.componentFactory.add('fontAwesome', locale => {
		const button = new ButtonView(locale);
		button.set({ label: t('FontAwesome icons'), icon: IconFontAwesome, tooltip: true });
		button.on('execute', () => openFontAwesome(html => insertHtml(editor, html)));
		return button;
	});
}

async function openFontAwesome(onPick) {
	faLists ??= Promise.all(['free.txt', 'brands.txt'].map(f => fetch(new URL(f, FA_LIST_URL)).then(r => r.text())))
		.then(([solid, brands]) => ({ 'fa-solid': solid.split(','), 'fa-brands': brands.split(',') }));
	let type = 'fa-solid';
	let colorSet = false;
	const search = el('input', { type: 'search', placeholder: t('Search icons (e.g. home, user)'), ariaLabel: t('Search icons') });
	const color = el('input', { type: 'color', ariaLabel: t('Color'), oninput: () => { colorSet = true; } });
	const size = el('input', { type: 'number', min: 8, max: 200, placeholder: t('Default'), ariaLabel: t('Size (px)') });
	const fixed = el('input', { type: 'checkbox' });
	const border = el('input', { type: 'checkbox' });
	const spin = el('input', { type: 'checkbox' });
	const rotate = el('select', { ariaLabel: t('Rotate / flip') },
		...[['', t('No rotation')], ['fa-rotate-90', t('Rotate 90°')], ['fa-rotate-180', t('Rotate 180°')], ['fa-rotate-270', t('Rotate 270°')],
			['fa-flip-horizontal', t('Flip horizontally')], ['fa-flip-vertical', t('Flip vertically')], ['fa-flip-both', t('Flip both')]]
			.map(([value, textContent]) => el('option', { value, textContent })));
	const grid = el('div', { className: 'ck5-browser-grid ck5-fa-grid' });
	const tabs = [['fa-solid', 'Solid'], ['fa-brands', 'Brands']].map(([t, text]) => {
		const tab = el('button', {
			type: 'button', textContent: text, role: 'tab',
			onclick: () => {
				type = t;
				tabs.forEach(b => b.setAttribute('aria-selected', String(b === tab)));
				render();
			}
		});
		tab.setAttribute('aria-selected', String(t === type));
		return tab;
	});
	const dialog = el('dialog', { className: 'ck5-browser', ariaLabel: t('FontAwesome icons') },
		el('form', { method: 'dialog', className: 'ck5-browser-header' },
			el('div', { className: 'ck5-browser-tabs', role: 'tablist', ariaLabel: t('Type') }, ...tabs),
			el('button', { textContent: '×', ariaLabel: t('Close') })),
		el('div', { className: 'ck5-browser-tools ck5-fa-tools' },
			search,
			el('label', {}, t('Color'), ' ', color),
			el('label', {}, t('Size'), ' ', size, ' px'),
			el('label', {}, fixed, ' ', t('Fixed width')),
			el('label', {}, border, ' ', t('Bordered')),
			el('label', {}, spin, ' ', t('Spin')),
			rotate),
		grid);

	const lists = await faLists;
	function render() {
		const q = search.value.trim().toLowerCase();
		grid.replaceChildren(...lists[type].filter(name => name.includes(q)).map(name =>
			el('button', { type: 'button', title: name, onclick: () => pick(name) },
				el('span', { className: `${type} fa-${name}` }), el('span', { textContent: name }))));
	}
	function pick(name) {
		const cls = [type, `fa-${name}`, fixed.checked && 'fa-fw', border.checked && 'fa-border', spin.checked && 'fa-spin', rotate.value].filter(Boolean);
		const style = [colorSet && `color:${color.value}`, size.value && `font-size:${Number(size.value)}px`].filter(Boolean).join(';');
		dialog.close();
		onPick(`<span class="${cls.join(' ')}"${style ? ` style="${style}"` : ''} aria-hidden="true"></span>`);
	}
	search.addEventListener('input', render);
	dialog.addEventListener('close', () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	render();
	search.focus();
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

// 選檔器（仿 elFinder 版面）：左側資料夾樹、上方圖示工具列、下方狀態列
// 單擊選取、雙擊開啟資料夾或插入檔案；上傳可按鈕或拖曳（可多檔）
// 改名、剪下／貼上（搬移）、刪除限模組管理員，網址異動會同步更新文章
// 圖片、檔案在伺服器上分開存放（uploads/.../image、.../file），在樹狀目錄切換
// 多選：Ctrl／⌘ 點選加減、Shift 點選範圍、Ctrl+A 全選；改名、資訊、預覽、插入只對單一項目
// ponytail: 沒有右鍵選單、複製（只有剪下）
const formatSize = bytes => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
const formatTime = sec => new Date(sec * 1000).toLocaleString(lang === 'zh' ? 'zh-TW' : 'en', { hour12: false });
const typeLabel = type => type === 'image' ? t('Images') : t('Files');

function openBrowser(browseUrl, title, onPick, startType = 'image') {
	const base = new URL(browseUrl, location.href);
	let type = startType;
	let path = '';
	let res = { dirs: [], files: [] };
	let selection = []; // 選取的項目 [{ name, isDir, file }]
	let anchor = null; // Shift 範圍選取的起點
	let entries = []; // 畫面上的項目（套用搜尋後）
	const single = () => selection.length === 1 ? selection[0] : null;
	// 操作對象：有選取用選取的；沒選取且在子資料夾裡，就是目前資料夾本身（同 elFinder 在左側樹選資料夾）
	const targets = () => selection.length || !path ? selection : [{ name: path.split('/').pop(), isDir: true, parent: path.split('/').slice(0, -1).join('/') }];
	const target = () => targets().length === 1 ? targets()[0] : null;
	const at = entry => ({ path: entry.parent ?? path });
	const isSelected = entry => selection.some(s => s.name === entry.name);
	let view = 'icons';
	let clipboard = null; // 剪下的項目 { type, path, names }
	const back = [];
	const forward = [];
	const trees = { image: [], file: [] };

	const endpoint = (file, at = {}) => {
		const url = new URL(file, base);
		url.search = base.search;
		url.searchParams.set('type', at.type ?? type);
		url.searchParams.set('path', at.path ?? path);
		return url;
	};
	async function request(file, body, at) {
		const r = await fetch(endpoint(file, at), body ? { method: 'POST', body } : {})
			.then(x => x.json()).catch(() => ({ error: { message: t('Connection failed') } }));
		if (r.error) {
			message.textContent = r.error.message || String(r.error);
		}
		return r;
	}

	// 工具列：Font Awesome 圖示按鈕，依選取狀態啟用／停用
	const tool = (icon, label, onclick) => el('button', { type: 'button', title: label, ariaLabel: label, onclick }, el('i', { className: `fa-solid ${icon}`, ariaHidden: 'true' }));
	const tb = {
		back: tool('fa-arrow-left', t('Back'), () => go(back, forward)),
		forward: tool('fa-arrow-right', t('Forward'), () => go(forward, back)),
		up: tool('fa-arrow-up', t('Up'), () => navigate(type, path.split('/').slice(0, -1).join('/'))),
		reload: tool('fa-rotate-right', t('Reload'), () => { loadTree(); load(); }),
		home: tool('fa-house', t('Home'), () => navigate(type, '')),
		upload: tool('fa-upload', t('Upload files'), () => fileInput.click()),
		mkdir: tool('fa-folder-plus', t('New folder'), mkdir),
		pick: tool('fa-check', t('Select (insert file or open folder)'), () => single() && open(single())),
		preview: tool('fa-eye', t('Preview'), () => single()?.file && window.open(single().file.url, '_blank', 'noopener')),
		download: tool('fa-download', t('Download'), download),
		info: tool('fa-circle-info', t('Info'), info),
		rename: tool('fa-pen', t('Rename'), rename),
		cut: tool('fa-scissors', t('Cut'), () => {
			clipboard = { type, path: at(targets()[0]).path, names: targets().map(entry => entry.name) };
			message.textContent = t('Cut %0 item(s). Go to the destination folder and click "Paste".', clipboard.names.length);
			sync();
		}),
		paste: tool('fa-paste', t('Paste'), paste),
		remove: tool('fa-trash-can', t('Delete'), remove),
		icons: tool('fa-table-cells-large', t('Icon view'), () => { view = 'icons'; draw(); }),
		list: tool('fa-list', t('List view'), () => { view = 'list'; draw(); })
	};
	const search = el('input', { type: 'search', placeholder: t('Search'), ariaLabel: t('Search the current folder'), oninput: () => draw() });
	const group = (...buttons) => el('div', { className: 'ck5-fm-group' }, ...buttons);
	const toolbar = el('div', { className: 'ck5-fm-toolbar', role: 'toolbar', ariaLabel: t('Toolbar') },
		group(tb.back, tb.forward, tb.up),
		group(tb.reload, tb.home),
		group(tb.upload, tb.mkdir),
		group(tb.pick, tb.preview, tb.download, tb.info),
		group(tb.rename, tb.cut, tb.paste, tb.remove),
		group(tb.icons, tb.list),
		el('div', { className: 'ck5-fm-search' }, el('i', { className: 'fa-solid fa-magnifying-glass' }), search));

	const tree = el('nav', { className: 'ck5-fm-tree', ariaLabel: t('Folder') });
	const main = el('div', {
		className: 'ck5-fm-main', tabIndex: -1,
		onclick: e => {
			if (!e.target.closest('.ck5-fm-item')) {
				selection = [];
				markSelected();
				sync();
			}
		},
		onkeydown: e => {
			if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				selection = [...entries];
				markSelected();
				sync();
			}
		}
	});
	const message = el('span', { className: 'ck5-fm-message' });
	message.setAttribute('role', 'status');
	const summary = el('span', { className: 'ck5-fm-summary' });
	const fileInput = el('input', { type: 'file', multiple: true, hidden: true });
	const dialog = el('dialog', { className: 'ck5-browser ck5-fm', ariaLabel: title },
		el('form', { method: 'dialog', className: 'ck5-browser-header' },
			el('strong', { textContent: title }),
			el('button', { textContent: '×', ariaLabel: t('Close') })),
		toolbar,
		el('div', { className: 'ck5-fm-body' }, tree, main),
		el('div', { className: 'ck5-fm-statusbar' }, message, summary),
		fileInput);

	function navigate(toType, toPath, record = true) {
		if (record) {
			back.push({ type, path });
			forward.length = 0;
		}
		type = toType;
		path = toPath;
		load();
	}
	function go(from, to) {
		const target = from.pop();
		if (target) {
			to.push({ type, path });
			navigate(target.type, target.path, false);
		}
	}

	async function load() {
		message.textContent = t('Loading…');
		show(await request('browse.php'));
	}
	// browse.php 的 GET 與各項 POST 動作都回傳目前資料夾的清單
	function show(r) {
		if (r.error) {
			return;
		}
		message.textContent = '';
		syncEditors(r.replaced || []);
		res = r;
		selection = [];
		anchor = null;
		fileInput.accept = type === 'image' ? 'image/*' : '';
		draw();
		drawTree();
	}

	// 左側：圖片、檔案兩個根目錄，子資料夾全部展開
	async function loadTree() {
		for (const key of Object.keys(trees)) {
			const r = await request('browse.php', formData({ op: 'tree' }), { type: key, path: '' });
			trees[key] = r.dirs || [];
		}
		drawTree();
	}
	function drawTree() {
		const node = (key, dir, label, icon) => {
			const button = el('button', {
				type: 'button', title: label, onclick: () => navigate(key, dir),
				className: key === type && dir === path ? 'is-current' : ''
			}, el('i', { className: `fa-solid ${icon}` }), ' ', label);
			const children = trees[key].filter(d => d.split('/').slice(0, -1).join('/') === dir && d !== dir);
			return el('li', {}, button, ...(children.length
				? [el('ul', {}, ...children.map(d => node(key, d, d.split('/').pop(), 'fa-folder')))]
				: []));
		};
		tree.replaceChildren(el('ul', {},
			node('image', '', t('Images'), 'fa-image'),
			node('file', '', t('Files'), 'fa-paperclip')));
	}

	function draw() {
		const q = search.value.trim().toLowerCase();
		const match = name => !q || name.toLowerCase().includes(q);
		entries = [
			...res.dirs.filter(match).map(name => ({ name, isDir: true })),
			...res.files.filter(f => match(f.name)).map(f => ({ name: f.name, isDir: false, file: f }))
		];
		const item = (entry, ...content) => {
			const node = el(view === 'icons' ? 'button' : 'tr', {
				className: 'ck5-fm-item', title: entry.name,
				onclick: e => select(entry, e),
				ondblclick: () => open(entry),
				onkeydown: e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						open(entry);
					} else if (e.key === 'Delete' && !tb.remove.disabled) {
						isSelected(entry) || (selection = [entry]);
						remove();
					}
				}
			}, ...content);
			if (view === 'list') {
				node.tabIndex = 0;
			}
			node.dataset.name = entry.name;
			return node;
		};
		const visual = entry => entry.isDir
			? el('i', { className: 'fa-solid fa-folder ck5-fm-icon' })
			: IMAGE_EXT.test(entry.name)
				? el('img', { src: entry.file.url, alt: '', loading: 'lazy' })
				: el('span', { className: 'ck5-fm-icon ck5-fm-ext', textContent: entry.name.split('.').pop().toUpperCase() });
		const lock = entry => entry.file?.locked ? el('i', { className: 'fa-solid fa-lock ck5-fm-lock', title: t('Module attachment. Manage it from its own attachment feature.') }) : '';

		if (!entries.length) {
			main.replaceChildren(el('p', { className: 'ck5-fm-empty', textContent: q ? t('No matching items') : t('This folder is empty. Click "Upload" or drag files here.') }));
		} else if (view === 'icons') {
			main.replaceChildren(el('div', { className: 'ck5-fm-icons' },
				...entries.map(entry => item(entry, visual(entry), lock(entry), el('span', { className: 'ck5-fm-name', textContent: entry.name })))));
		} else {
			main.replaceChildren(el('table', { className: 'ck5-fm-list' },
				el('thead', {}, el('tr', {}, ...[t('Name'), t('Modified'), t('Size'), t('Type')].map(text => el('th', { textContent: text })))),
				el('tbody', {}, ...entries.map(entry => item(entry,
					el('td', {}, entry.isDir ? el('i', { className: 'fa-solid fa-folder' }) : el('i', { className: 'fa-regular fa-file' }), ' ', entry.name, lock(entry)),
					el('td', { textContent: entry.file ? formatTime(entry.file.mtime) : '' }),
					el('td', { textContent: entry.file ? formatSize(entry.file.size) : '' }),
					el('td', { textContent: entry.isDir ? t('Folder') : entry.name.split('.').pop().toUpperCase() }))))));
		}
		const total = res.files.reduce((sum, f) => sum + f.size, 0);
		summary.textContent = `${typeLabel(type)}${path ? ` / ${path}` : ''}　${t('Items: %0, total: %1', res.dirs.length + res.files.length, formatSize(total))}`;
		tb.icons.setAttribute('aria-pressed', String(view === 'icons'));
		tb.list.setAttribute('aria-pressed', String(view === 'list'));
		markSelected();
		sync();
	}
	function select(entry, e) {
		const from = anchor ? entries.findIndex(x => x.name === anchor.name) : -1;
		if (e.shiftKey && from >= 0) {
			const to = entries.findIndex(x => x.name === entry.name);
			const range = entries.slice(Math.min(from, to), Math.max(from, to) + 1);
			selection = e.ctrlKey || e.metaKey ? [...selection.filter(s => !range.some(r => r.name === s.name)), ...range] : range;
		} else if (e.ctrlKey || e.metaKey) {
			selection = isSelected(entry) ? selection.filter(s => s.name !== entry.name) : [...selection, entry];
			anchor = entry;
		} else {
			selection = [entry];
			anchor = entry;
		}
		markSelected();
		sync();
	}
	function markSelected() {
		main.querySelectorAll('.ck5-fm-item').forEach(node => node.classList.toggle('is-selected', selection.some(s => s.name === node.dataset.name)));
		const one = single();
		if (one) {
			message.textContent = one.file ? `${one.name}（${formatSize(one.file.size)}）` : one.name;
		} else if (selection.length) {
			const size = selection.reduce((sum, s) => sum + (s.file?.size || 0), 0);
			message.textContent = t('%0 item(s) selected (files total %1)', selection.length, formatSize(size));
		} else if (path) {
			message.textContent = t('Current folder "%0": with nothing selected, Rename, Cut, Delete and Info apply to this folder', path.split('/').pop());
		}
	}
	// 依目前狀態啟用工具列按鈕
	function sync() {
		const one = single();
		const canEdit = res.can_manage && targets().length > 0 && targets().every(s => !s.file?.locked);
		tb.back.disabled = !back.length;
		tb.forward.disabled = !forward.length;
		tb.up.disabled = !path;
		tb.pick.disabled = !one;
		tb.preview.disabled = !one?.file;
		tb.download.disabled = !selection.some(s => s.file);
		tb.info.disabled = !target();
		tb.rename.disabled = !(canEdit && target());
		tb.cut.disabled = tb.remove.disabled = !canEdit;
		tb.paste.disabled = !res.can_manage || !clipboard || clipboard.type !== type;
	}

	function open(entry) {
		if (entry.isDir) {
			navigate(type, path ? `${path}/${entry.name}` : entry.name);
		} else {
			dialog.close();
			onPick(entry.file.url);
		}
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
		const name = prompt(t('New folder name (letters, digits, underscores, hyphens)'));
		if (name) {
			show(await request('browse.php', formData({ op: 'mkdir', name })));
			loadTree();
		}
	}

	async function rename() {
		const entry = target();
		const { name, isDir } = entry;
		const stem = isDir ? name : name.replace(/\.[^.]+$/, '');
		const newName = prompt(`${t(isDir ? 'New name for "%0" (letters, digits, underscores, hyphens)' : 'New name for "%0" (letters, digits, underscores, hyphens; extension unchanged)', name)}\n${t('URLs referenced in articles will be updated too.')}`, stem);
		if (newName && newName !== stem) {
			const r = await request('browse.php', formData({ op: 'rename', name, new_name: newName }), at(entry));
			if (r.error) {
				return;
			}
			path = at(entry).path; // 改的是目前資料夾時，回到上一層看結果
			show(r);
			isDir && loadTree();
		}
	}

	// 貼上 = 把剪下的項目逐一搬到目前資料夾；move 以來源資料夾為基準
	async function paste() {
		const { names, path: from } = clipboard;
		if (from === path) {
			message.textContent = t('Already in this folder');
			return;
		}
		const errors = [];
		for (const name of names) {
			const r = await request('browse.php', formData({ op: 'move', name, to: path }), { path: from });
			r.error ? errors.push(t('%0: %1', name, r.error.message || r.error)) : syncEditors(r.replaced || []);
		}
		clipboard = null;
		await load();
		loadTree();
		message.textContent = errors.join(t('; '));
	}

	// 刪除前逐一檢查：模組附件不可刪；被文章引用的列出筆數一起確認
	async function remove() {
		const list = targets();
		const used = [];
		for (const entry of list) {
			const { name } = entry;
			const r = await request('browse.php', formData({ op: 'refs', name }), at(entry));
			if (r.error) {
				return;
			}
			if (r.locked) {
				message.textContent = t('"%0" is a module attachment (or the folder contains module attachments). Manage it from its own attachment feature.', name);
				return;
			}
			Object.entries(r.refs).forEach(([table, n]) => used.push(`${list.length > 1 ? `${name} → ` : ''}${t('%0: %1 record(s)', table, n)}`));
		}
		const label = list.length > 1 ? t('these %0 items', list.length) : t('"%0"', list[0].name);
		const scope = list.some(e => e.isDir) ? t('All files in the folder will be deleted too. ') : '';
		const text = used.length
			? t('The following data references %0, and these links will break after deletion:\n%1\n\n%2Are you sure you want to delete?', label, used.join('\n'), scope)
			: t('Delete %0? %1This cannot be undone.', label, scope);
		if (!confirm(text)) {
			return;
		}
		const errors = [];
		let last = null;
		for (const entry of list) {
			const r = await request('browse.php', formData({ op: 'delete', name: entry.name }), at(entry));
			r.error ? errors.push(t('%0: %1', entry.name, r.error.message || r.error)) : (last = r);
		}
		if (last) {
			path = at(list[0]).path; // 刪的是目前資料夾時，回到上一層
			show(last);
		} else {
			await load();
		}
		list.some(e => e.isDir) && loadTree();
		message.textContent = errors.join(t('; '));
	}

	function download() {
		for (const { name, file } of selection.filter(s => s.file)) {
			const link = el('a', { href: file.url, download: name });
			document.body.append(link);
			link.click();
			link.remove();
		}
	}

	// 資訊：名稱、大小、日期、網址；模組管理員另外顯示被引用的筆數
	async function info() {
		const entry = target();
		const { name, isDir, file } = entry;
		const rows = [[t('Name'), name], [t('Type'), isDir ? t('Folder') : name.split('.').pop().toUpperCase()]];
		if (file) {
			rows.push([t('Size'), formatSize(file.size)], [t('Modified'), formatTime(file.mtime)], [t('URL'), file.url]);
		}
		if (res.can_manage) {
			const r = await request('browse.php', formData({ op: 'refs', name }), at(entry));
			const used = Object.entries(r.refs || {}).map(([table, n]) => t('%0: %1 record(s)', table, n));
			rows.push([t('Referenced by'), used.length ? used.join(t(', ')) : t('None')], [t('Module attachment'), r.locked ? t('Yes (cannot be renamed, moved or deleted)') : t('No')]);
		}
		const box = el('dialog', { className: 'ck5-browser-move', ariaLabel: t('Info: %0', name) },
			el('form', { method: 'dialog' },
				el('table', { className: 'ck5-fm-info' }, ...rows.map(([k, v]) => el('tr', {}, el('th', { textContent: k }), el('td', { textContent: v })))),
				el('div', { className: 'ck5-browser-buttons' }, el('button', { value: 'ok', textContent: t('Close') }))));
		box.addEventListener('close', () => box.remove());
		document.body.append(box);
		box.showModal();
	}

	async function upload(files) {
		const errors = [];
		let always = null; // 勾了「其餘同名檔案也這樣處理」時記住選擇
		for (const [i, file] of files.entries()) {
			message.textContent = t('Uploading %0/%1: %2', i + 1, files.length, file.name);
			let r = await request('upload.php', formData({ upload: file, conflict: 'ask' }));
			if (r.conflict) {
				let choice = always;
				if (!choice || (choice === 'replace' && !r.conflict.can_replace)) {
					[choice, always] = await askConflict(r.conflict, files.length - i > 1);
				}
				if (choice === 'skip') {
					continue;
				}
				r = await request('upload.php', formData({ upload: file, conflict: choice }));
			}
			if (r.error) {
				errors.push(t('%0: %1', file.name, r.error.message || r.error));
			}
		}
		await load();
		message.textContent = errors.join(t('; '));
	}

	// 同名檔案：取代（網址不變，文章連結自動指向新檔）／另存新檔（加編號）／略過；回傳 [選擇, 是否套用到其餘]
	function askConflict({ name, can_replace }, hasMore) {
		return new Promise(resolve => {
			const applyAll = el('input', { type: 'checkbox' });
			const box = el('dialog', { className: 'ck5-browser-move', ariaLabel: t('Duplicate file name') },
				el('form', { method: 'dialog' },
					el('p', { textContent: t('This folder already has "%0".', name) }),
					el('p', { className: 'ck5-browser-hint', textContent: can_replace
						? t('Replace: the old file is replaced by the new one with the same URL, so links in articles show the new file (the browser may need a refresh).')
						: t('Only module administrators can replace old files, and module attachments cannot be replaced.') }),
					...(hasMore ? [el('label', {}, applyAll, ' ', t('Apply to the remaining duplicates'))] : []),
					el('div', { className: 'ck5-browser-buttons' },
						el('button', { value: 'skip', textContent: t('Skip') }),
						el('button', { value: 'rename', textContent: t('Save as new file') }),
						...(can_replace ? [el('button', { value: 'replace', textContent: t('Replace') })] : []))));
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
	sync();
	load();
	loadTree();
}

// 對應 CK4 ck_wcag 的 forcePasteAsPlainText：從外部貼上一律轉純文字（只貼圖片時照常上傳）
function PlainTextPaste(editor) {
	if (!editor.config.get('tad')?.plainTextPaste) {
		return;
	}
	editor.editing.view.document.on('clipboardInput', (evt, data) => {
		const text = data.dataTransfer.getData('text/plain');
		if (data.method === 'paste' && text) {
			data.content = editor.data.htmlProcessor.toView(plainTextToHtml(text));
		}
	}, { priority: 'high' });
}

// 程式碼區塊語法上色：CodeMirror 5 runMode 斷詞（sourceeditingcodemirror.js 已載入 window.CodeMirror），
// 用 CSS Custom Highlight API 上色，不動編輯區 DOM，存檔內容不變；顏色在 style.css 的 ::highlight(cm-*)
const CODE_MODES = { html: 'htmlmixed', css: 'css', javascript: 'javascript', php: 'text/x-php', sql: 'text/x-sql', python: 'python', bash: 'shell', json: 'application/json' };
const codeHighlights = {};

function CodeBlockHighlight(editor) {
	// ponytail: 不支援 Highlight API 的舊瀏覽器（Firefox < 140）就不上色
	if (!window.CSS?.highlights || !window.CodeMirror?.runMode) {
		return;
	}
	const view = editor.editing.view;
	let mine = [];
	// ponytail: 每次 render 重新斷詞全部程式碼區塊，區塊很大時才需要改成只處理有變動的
	view.on('render', () => {
		mine.forEach(([highlight, range]) => highlight.delete(range));
		mine = [];
		for (const code of view.getDomRoot()?.querySelectorAll('pre > code[class*="language-"]') || []) {
			const mode = CODE_MODES[code.className.match(/language-(\S+)/)[1]];
			if (!mode) {
				continue;
			}
			// 文字節點串成完整原始碼（<br> 視為換行），記下每個節點的起點以便換回 DOM 位置
			const nodes = [];
			let text = '';
			const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
			while (walker.nextNode()) {
				const node = walker.currentNode;
				if (node.nodeType === Node.TEXT_NODE) {
					nodes.push({ node, start: text.length });
					text += node.data;
				} else if (node.nodeName === 'BR') {
					text += '\n';
				}
			}
			const locate = (offset, end) => {
				const hit = nodes.find(n => end ? offset <= n.start + n.node.data.length : offset < n.start + n.node.data.length);
				return hit && [hit.node, offset - hit.start];
			};
			let pos = 0;
			window.CodeMirror.runMode(text, mode, (token, style) => {
				const from = pos;
				pos += token.length;
				const start = style && locate(from);
				const end = style && locate(pos, true);
				if (!start || !end) {
					return;
				}
				const range = new Range();
				range.setStart(...start);
				range.setEnd(...end);
				for (const name of style.split(' ')) {
					if (!codeHighlights[name]) {
						// 用 window.Highlight：本檔的 Highlight 是 CK5 螢光筆外掛
						codeHighlights[name] = new window.Highlight();
						CSS.highlights.set(`cm-${name}`, codeHighlights[name]);
					}
					codeHighlights[name].add(range);
					mine.push([codeHighlights[name], range]);
				}
			});
		}
	}, { priority: 'low' });
}

// 取代 CK4 pasteUploadImage 的 pasteUploadImageUrlApi：貼上的外站圖片下載到本站
function PasteRemoteImage(editor) {
	// 外站圖片轉存與上傳共用 upload.php（?url=）
	const uploadUrl = editor.config.get('simpleUpload.uploadUrl');
	if (!uploadUrl) {
		return;
	}
	const localize = async src => {
		const res = await fetch(`${uploadUrl}&url=${encodeURIComponent(src)}`).then(r => r.json()).catch(() => null);
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

export function createEditor(element, { uploadUrl, browseUrl, placeholder = '', toolbar = 'my', height, plainTextPaste = false, styles = [], language = document.documentElement.lang } = {}) {
	// 語系由 CkEditor5.php 依 _LANGCODE 傳入；CKEDITOR.replace 相容層沒傳就看 <html lang>
	lang = /^zh/i.test(language) ? 'zh' : 'en';
	return ClassicEditor.create(element, {
		tad: { browseUrl, plainTextPaste },
		licenseKey: 'GPL',
		language: lang,
		translations: lang === 'zh' ? [translations] : [],
		toolbar: { items: toolbars[toolbar] || toolbars.my, shouldNotGroupWhenFull: true },
		placeholder,
		plugins: [
			Alignment, Autoformat, AutoImage, AutoLink, BlockQuote, Bold, Code, CodeBlock, Emoji, Essentials,
			FindAndReplace, FontBackgroundColor, FontColor, FontFamily, FontSize, FullPage, GeneralHtmlSupport,
			Heading, Highlight, HorizontalLine, HtmlComment, HtmlEmbed, ImageBlock, ImageCaption, ImageInline,
			ImageResize, ImageStyle, ImageTextAlternative, ImageToolbar, ImageUpload,
			Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties, MediaEmbed, Mention, Paragraph,
			PasteFromMarkdownExperimental, PasteFromOffice, PlainTableOutput, RemoveFormat,
			SimpleUploadAdapter, SourceEditing, Strikethrough, Style, Subscript, Superscript, Table, TableCaption,
			TableCellProperties, TableColumnResize, TableLayout, TableProperties, TableToolbar, TextTransformation,
			TodoList, Underline, WordCount, PageBreak,
			BootstrapTable, ImageDialog, LinkDialog, PasteRemoteImage, PlainTextPaste, SourceEditingCodeMirror, CodeBlockHighlight, FontAwesome, TextDropdowns, ColumnWidget, ColumnTemplates, CleanLegacyHtml,
			TextShadowStyle, CodeShortcut
		],
		// 取代 CK4 embed/embedsemantic：直接輸出 iframe，前台不需額外 JS
		mediaEmbed: { previewsInData: true },
		// 取代 CK4 syntaxhighlight/prism/codesnippet：輸出 <pre><code class="language-xxx">，prism 可直接上色
		codeBlock: {
			languages: [
				{ language: 'plaintext', label: t('Plain text') },
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
		fontFamily: { options: fontFamilyOptions, supportAllValues: true },
		fontSize: { options: fontSizeOptions, supportAllValues: true },
		heading: {
			options: [
				{ model: 'paragraph', title: t('Paragraph'), class: 'ck-heading_paragraph' },
				...[1, 2, 3, 4, 5, 6].map(n => ({ model: `heading${n}`, view: `h${n}`, title: t('Heading %0', n), class: `ck-heading_heading${n}` }))
			]
		},
		pasteFromOffice: { removeStyles: true, removeClasses: true, handleImages: true },
		// allowEmpty：保留 CK4 ckeditorfa 插入的 <i class="fa ..."></i> 空元素
		htmlSupport: { allow: [{ name: /^.*$/, styles: true, attributes: true, classes: true }], allowEmpty: ['i', 'span'] },
		image: {
			toolbar: [
				'imageDialog', 'toggleImageCaption', 'imageTextAlternative', '|',
				'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
				'resizeImage'
			]
		},
		link: {
			addTargetToExternalLinks: true,
			defaultProtocol: 'https://',
			decorators: {
				toggleDownloadable: { mode: 'manual', label: t('Download'), attributes: { download: 'file' } }
			}
		},
		list: { properties: { styles: true, startIndex: true, reversed: true } },
		style: { definitions: [...styleDefinitions(), ...styles] },
		// 取代 CK4 smiley；表情資料放本站（取自 cdn.ckeditor.com/ckeditor5/data/emoji/16/en.json），不依賴外部 CDN
		emoji: { definitionsUrl: new URL('emoji-en.json', import.meta.url).href },
		// 原始碼模式語法高亮（sourceeditingcodemirror.js，CodeMirror 5 選項）
		sourceEditingCodeMirror: { options: { mode: 'htmlmixed', lineNumbers: true, lineWrapping: true, viewportMargin: Infinity } },
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
		insertHtml: html => insertHtml(editor, html),
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
	return createEditor(element, {
		uploadUrl: query ? new URL(`upload.php?${query}`, import.meta.url).href : undefined,
		browseUrl: query ? new URL(`browse.php?${query}`, import.meta.url).href : undefined,
		placeholder: config.editorplaceholder || '',
		toolbar: config.toolbar || 'my',
		plainTextPaste: !!config.forcePasteAsPlainText,
		height: config.height ? String(config.height) : undefined
	});
});
