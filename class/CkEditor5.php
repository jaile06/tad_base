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
    // ponytail: 以下為 CK4 相容屬性，CK5 不使用
    public $wcag     = true;
    public $CustomConfigurationsPath;
    public $Style = [];

    public function __construct($xoopsDirName = '', $ColName = '', $Value = '', $subDir = '')
    {
        $this->xoopsDirName = $xoopsDirName;
        $this->ColName      = $ColName;
        $this->ColID        = "editor_{$ColName}";
        $this->Value        = $Value;
        $this->subDir       = $subDir;
    }

    //設定工具列（my 為完整，其餘為精簡）
    public function setToolbarSet($ToolbarSet = '')
    {
        $this->ToolbarSet = $ToolbarSet;
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
        // ponytail: Font Awesome 由佈景載入，這裡不重複帶
        $css = array_merge([
            "{$pkg_url}/ckeditor5.css",
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
        $content = htmlspecialchars((string) $this->Value, ENT_QUOTES, 'UTF-8');
        $query   = http_build_query(['subDir' => $this->subDir, 'mod_dir' => $this->xoopsDirName]);
        $options = json_encode([
            'uploadUrl'      => "{$pkg_url}/upload.php?{$query}",
            'remoteImageUrl' => "{$pkg_url}/upload.php?{$query}",
            'browseUrl'      => "{$pkg_url}/browse.php?{$query}",
            'placeholder'    => (string) $this->placeholder,
            'toolbar'        => $this->ToolbarSet === 'my' ? 'full' : 'basic',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);

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
