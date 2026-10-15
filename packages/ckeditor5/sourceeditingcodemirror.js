/**
 * 取自 https://github.com/cdubz/ckeditor5-source-editing-codemirror（GPL-2.0-or-later, v35.1.0）
 * 改動：import 改用本目錄的 ckeditor5.js；CodeMirror 5 由 ../codemirror/codemirror.js 掛到 window.CodeMirror；
 * 外觀 CSS 併入 style.css
 */
import { Plugin, global } from './ckeditor5.js';
import '../codemirror/codemirror.js';

export default class SourceEditingCodeMirror extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ 'SourceEditing' ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'SourceEditingCodeMirror';
	}

	/**
	* @inheritDoc
	*/
	constructor( editor ) {
		super( editor );
		editor.config.define( 'sourceEditingCodeMirror', {
			options: global.window.CodeMirror.defaults
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this._cmEditors = [];
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		if ( !global.window.CodeMirror ) {
			global.window.console.error( 'The CodeMirror 5 library must be provided.' );
			return;
		}

		const editor = this.editor;

		this.listenTo( editor.plugins.get( 'SourceEditing' ), 'change:isSourceEditingMode', ( evt, name, isSourceEditingMode ) => {
			if ( !isSourceEditingMode ) {
				leaveEditingSourceMode( editor );
			} else {
				enterEditingSourceMode( editor );
			}
		} );
	}
}

/**
 * Finalizes all CodeMirror instances when leaving source edit mode.
 *
 * @param {module:core/editor/editor} editor
 */
function leaveEditingSourceMode( editor ) {
	const sourceEditingCodeMirror = editor.plugins.get( 'SourceEditingCodeMirror' );

	for ( const cmEditor of sourceEditingCodeMirror._cmEditors ) {
		cmEditor.toTextArea();
	}

	sourceEditingCodeMirror._cmEditors = [];
}

/**
 * Initializes all CodeMirror instances when entering source edit mode.
 *
 * @param {module:core/editor/editor} editor
 */
function enterEditingSourceMode( editor ) {
	const sourceEditing = editor.plugins.get( 'SourceEditing' );
	const sourceEditingCodeMirror = editor.plugins.get( 'SourceEditingCodeMirror' );

	for ( const [ , viewWrapper ] of sourceEditing._replacedRoots ) {
		const textarea = viewWrapper.childNodes[ 0 ];
		var options = {};
		Object.assign(options, editor.config.get( 'sourceEditingCodeMirror.options' ));
		const cmEditor = global.window.CodeMirror.fromTextArea( textarea, options );
		cmEditor.on( 'change', () => {
			textarea.value = cmEditor.getValue();
			textarea.dispatchEvent( new global.window.Event( 'input' ) );
		} );

		sourceEditingCodeMirror._cmEditors.push( cmEditor );
	}
}

