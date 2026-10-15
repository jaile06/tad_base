<?php
namespace XoopsModules\Tad_base;

/*
 * 與 XoopsModules\Tadtools\CkEditor 相同介面，換 use 即可替換
 * use XoopsModules\Tad_base\CkEditor5 as CkEditor;
 * $CkEditor = new CkEditor('tadnews', 'news_content', $news_content);
 * $CkEditor->setHeight(350);
 * $editor = $CkEditor->render();
 */
class CkEditor5
{
    public $xoopsDirName;
    public $ColName;
    public $ColID;
    public $ToolbarSet  = 'my';
    public $Width       = '100%';
    public $Height      = 300;
    public $Value;
    public $ContentsCss = [];
    public $subDir      = '';
    public $placeholder = '';
    public $Modal_ID = '';
    // 搭配 tadtools 偏好設定 ck_wcag：兩者皆開時貼上一律轉純文字（同 CK4 forcePasteAsPlainText）
    public $wcag     = true;
    public $Style    = [];
    // ponytail: 以下為 CK4 相容屬性，CK5 不使用
    public $CustomConfigurationsPath;
    public $demopublickey = '';

    public function __construct($xoopsDirName = '', $ColName = '', $Value = '', $subDir = '')
    {
        $this->xoopsDirName = $xoopsDirName;
        $this->ColName      = $ColName;
        $this->ColID        = "editor_{$ColName}";
        $this->Value        = $Value;
        $this->subDir       = $subDir;
    }

    //設定工具列（同 CK4：my、myBasic、tadBasic、mySimple、tadSimple，其餘視為 my）
    public function setToolbarSet($ToolbarSet = '')
    {
        $this->ToolbarSet = $ToolbarSet;
    }

    //新增樣式（同 CK4 介面）；CK5 樣式只支援 class，沒有 class 的項目略過
    public function setStyle($name, $element, $attributes = [], $styles = [])
    {
        $this->Style[] = ['name' => $name, 'element' => $element, 'attributes' => $attributes, 'styles' => $styles];
    }

    //CK4 相容，CK5 不使用
    public function setCustomConfigurationsPath($path = '')
    {
        $this->CustomConfigurationsPath = $path;
    }

    //CK4 相容，CK5 不使用（CK4 的 uploadcare 也已停用）
    public function set_demopublickey($demopublickey = '')
    {
        $this->demopublickey = $demopublickey;
    }

    public function setWidth($Width = '')
    {
        $this->Width = $Width;
    }

    public function setHeight($Height = '')
    {
        $this->Height = $Height;
    }

    public function setVar($var = '', $val = '')
    {
        $this->$var = $val;
    }

    //CK5 內容直接套用頁面樣式，額外 CSS 改載入到頁面
    public function setContentCss($ContentsCss = '')
    {
        $this->ContentsCss[] = $ContentsCss;
    }

    //前台顯示 CK5 內容用：只載入圖片對齊、縮放、圖說等 class 樣式（字型與元素外觀沿用佈景）
    //輸出時外層要包 <div class="ck-content">；ckeditor5-front.css 由 build-front-css.js 產生
    public static function loadContentCss()
    {
        global $xoTheme;
        $href = XOOPS_URL . '/modules/tad_base/packages/ckeditor5/ckeditor5-front.css';
        if ($xoTheme) {
            $xoTheme->addStylesheet($href);
            return '';
        }
        return "<link rel='stylesheet' href='{$href}'>";
    }

    public function render()
    {
        global $xoTheme;

        $pkg_url = XOOPS_URL . '/modules/tad_base/packages/ckeditor5';
        // CK4 的 contentsCss（清單 class、字型），CK5 無 iframe，直接載入頁面
        // Font Awesome（CK4 ckeditorfa 插入的圖示）：有裝 tadtools 時用它那份（preload 已用同一相對路徑載入，xoTheme 不會重複載入），沒裝才用自帶的
        $fa = is_file(XOOPS_ROOT_PATH . '/modules/tadtools/css/fontawesome6/css/all.min.css')
            ? 'modules/tadtools/css/fontawesome6/css/all.min.css'
            : 'modules/tad_base/packages/fontawesome6/css/all.min.css';
        $css = array_merge([
            $xoTheme ? $fa : XOOPS_URL . "/{$fa}",
            "{$pkg_url}/ckeditor5.css",
            XOOPS_URL . '/modules/tad_base/packages/codemirror/codemirror.css',
            "{$pkg_url}/style.css",
            "{$pkg_url}/ckeditor.css",
            "{$pkg_url}/fonts.css",
        ], $this->ContentsCss);

        $editor = '';
        foreach ($css as $href) {
            if ($xoTheme) {
                $xoTheme->addStylesheet($href);
            } else {
                $editor .= "<link rel='stylesheet' href='{$href}'>\n";
            }
        }
        // CK4 相容層要在舊模組 inline script 前載入（xoTheme 放 head）
        if ($xoTheme) {
            $xoTheme->addScript("{$pkg_url}/ckeditor4-compat.js");
        } else {
            $editor .= "<script src='{$pkg_url}/ckeditor4-compat.js'></script>\n";
        }

        // CK4 的 Modal_ID：點 #btn{Modal_ID} 開啟 modal（CK5 無 iframe，不必延後初始化）
        // 優先用 Bootstrap 5 原生 API，舊佈景退回 jQuery 外掛
        if ($this->Modal_ID != '') {
            $modal = json_encode((string) $this->Modal_ID, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT);
            $editor .= "<script>document.addEventListener('click', function (e) {
                var id = {$modal};
                if (!e.target.closest('#btn' + id)) return;
                var m = document.getElementById(id);
                if (window.bootstrap && bootstrap.Modal) { bootstrap.Modal.getOrCreateInstance(m).show(); }
                else if (window.jQuery) { jQuery(m).modal('show'); }
            });</script>\n";
        }

        $width   = is_numeric($this->Width) ? "{$this->Width}px" : $this->Width;
        $height  = is_numeric($this->Height) ? "{$this->Height}px" : $this->Height;
        $id      = htmlspecialchars($this->ColID, ENT_QUOTES);
        $name    = htmlspecialchars($this->ColName, ENT_QUOTES);
        // 同 CK4：[ 轉成 &#91;，避免 xlanguage 等輸出過濾把內容裡的 [xx] 當成標籤處理
        $content = str_replace('[', '&#91;', htmlspecialchars((string) $this->Value, ENT_QUOTES, 'UTF-8'));
        $query   = http_build_query(['subDir' => $this->subDir, 'mod_dir' => $this->xoopsDirName]);

        $tadtools_config = class_exists('\XoopsModules\Tadtools\Utility') ? \XoopsModules\Tadtools\Utility::TadToolsXoopsModuleConfig() : [];
        // setStyle() 加的樣式：CK5 只能套 class
        $styles = [];
        foreach ($this->Style as $style) {
            if (!empty($style['attributes']['class'])) {
                $styles[] = ['name' => $style['name'], 'element' => $style['element'], 'classes' => preg_split('/\s+/', trim($style['attributes']['class']))];
            }
        }

        $options = json_encode([
            'uploadUrl'      => "{$pkg_url}/upload.php?{$query}",
            'browseUrl'      => "{$pkg_url}/browse.php?{$query}",
            'placeholder'    => (string) $this->placeholder,
            'toolbar'        => (string) $this->ToolbarSet,
            'plainTextPaste' => !empty($tadtools_config['ck_wcag']) && $this->wcag,
            'styles'         => $styles,
            'language'       => _LANGCODE,
        ],JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);

        // textarea 為表單欄位，CK5 送出表單時會自動回寫內容
        $editor .= <<<HTML
        <div style="width:{$width}; --ck5-height:{$height};">
            <textarea name="{$name}" id="{$id}">{$content}</textarea>
        </div>
        <script type="module">
            import { createEditor } from '{$pkg_url}/main.js';
            createEditor(document.getElementById('{$id}'), {$options});
        </script>
        HTML;

        return $editor;
    }
}
