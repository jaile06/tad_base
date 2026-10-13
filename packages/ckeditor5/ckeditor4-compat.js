// CK4 相容層（一般 script，需在舊模組的 inline script 之前載入）
// 舊模組用到的 CKEDITOR.replace / instances / on('instanceReady')
// ponytail: 只做全站實際用到的 API，其他 CK4 API 需要時再補
window.CKEDITOR = window.CKEDITOR || (function () {
    var listeners = {};
    var resolve;
    var ready = new Promise(function (r) { resolve = r; });
    return {
        instances: {},
        on: function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); },
        fire: function (name, editor) { (listeners[name] || []).forEach(function (fn) { fn({ name: name, editor: editor }); }); },
        replace: function (el, config) { ready.then(function (create) { create(el, config); }); },
        _ready: resolve // main.js 載入後提供建立函式
    };
})();
