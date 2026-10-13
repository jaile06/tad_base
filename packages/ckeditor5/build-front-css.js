// 由 ckeditor5-content.css 產生前台用的 ckeditor5-front.css（CK5 升級後重跑：node build-front-css.js）
// 只保留「.ck-content 後面有 class/屬性」的規則（圖片對齊、縮放、圖說、媒體、標記色…）
// 丟掉 .ck-content 本身與純元素規則（字型、黑字、blockquote、hr、ol ol…），前台沿用佈景、舊文章外觀不變
// 也丟掉 .table：CK5 的 figure.table 樣式會套到 Bootstrap 的 table.table
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'ckeditor5-content.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const keepSelector = sel => {
	const rest = sel.trim().replace(/^\.ck-content/, '');
	if (rest === sel.trim()) {
		return false; // 不是 .ck-content 開頭（:root 另外處理）
	}
	return /[.[]/.test(rest) && !/\.table(?![\w-])/.test(rest);
};

// 依大括號切出頂層區塊，@media/@supports 遞迴處理
function filter(css) {
	let out = '';
	let i = 0;
	while (i < css.length) {
		const open = css.indexOf('{', i);
		if (open < 0) {
			break;
		}
		const head = css.slice(i, open).trim();
		let depth = 1;
		let j = open + 1;
		while (depth && j < css.length) {
			depth += css[j] === '{' ? 1 : css[j] === '}' ? -1 : 0;
			j++;
		}
		const body = css.slice(open + 1, j - 1);
		if (head.startsWith('@')) {
			const inner = filter(body);
			if (inner) {
				out += `${head}{${inner}}`;
			}
		} else if (head === ':root') {
			out += `${head}{${body}}`;
		} else {
			const kept = head.split(',').filter(keepSelector);
			if (kept.length) {
				out += `${kept.join(',')}{${body}}`;
			}
		}
		i = j;
	}
	return out;
}

const result = filter(src);
fs.writeFileSync(path.join(__dirname, 'ckeditor5-front.css'), `/* 由 build-front-css.js 產生，勿手改 */\n${result}\n`);
console.log(`ckeditor5-front.css: ${result.length} bytes（原檔 ${src.length}）`);
