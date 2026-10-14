<?php
// browse.php / upload.php 共用：登入檢查、同站來源、路徑限制在 uploads/{mod_dir}/{type}/{subDir}/ 之內
use Xmf\Request;

require_once dirname(__DIR__, 4) . '/mainfile.php';
header('Content-Type: application/json; charset=utf-8');

function ck5_fail($message, $code = 400)
{
    http_response_code($code);
    die(json_encode(['error' => ['message' => $message]], JSON_UNESCAPED_UNICODE));
}

function ck5_same_site($url)
{
    $a    = parse_url((string) $url);
    $b    = parse_url(XOOPS_URL);
    $port = fn($p) => $p['port'] ?? (strtolower($p['scheme'] ?? '') === 'https' ? 443 : 80);
    return !empty($a['host']) && !empty($b['host'])
    && strtolower($a['scheme'] ?? '') === strtolower($b['scheme'])
    && strtolower($a['host']) === strtolower($b['host'])
    && $port($a) === $port($b);
}

// 寫入動作（上傳、建資料夾、刪除）只接受本站發出的請求（Origin 優先，沒有才看 Referer）
function ck5_require_same_origin()
{
    if (!ck5_same_site($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '')) {
        ck5_fail('非法調用', 403);
    }
}

// 單一路徑段：不可含斜線、控制字元，不可以 . 開頭（擋 ..、隱藏檔、.htaccess）
function ck5_valid_segment($name)
{
    return is_string($name) && $name !== '' && mb_strlen($name) <= 100
    && preg_match('/^[^\/\\\\\x00-\x1f.][^\/\\\\\x00-\x1f]*$/u', $name);
}

// 去掉點與特殊字元（避免 a.php.jpg 這類雙副檔名），保留中英數、底線、連字號
function ck5_clean_name($name, $fallback)
{
    $name = trim(preg_replace('/[^\p{L}\p{N}_\-]+/u', '_', (string) $name), '_');
    return $name === '' ? $fallback : mb_substr($name, 0, 60);
}

if (!$xoopsUser) {
    ck5_fail('請先登入', 403);
}

$ck5_type = Request::getString('type') === 'file' ? 'file' : 'image';
$mod_dir  = Request::getString('mod_dir');
$subDir   = trim(str_replace('\\', '/', Request::getString('subDir')), '/');
$path     = trim(str_replace('\\', '/', Request::getString('path')), '/');
if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $mod_dir) || !preg_match('/^[a-zA-Z0-9_\-\/]*$/', $subDir) || strpos($subDir, '..') !== false) {
    ck5_fail('參數錯誤');
}
foreach ($path === '' ? [] : explode('/', $path) as $seg) {
    if (!ck5_valid_segment($seg)) {
        ck5_fail('路徑錯誤');
    }
}
// mod_dir 必須是已安裝、且使用者可讀取的模組，不能隨意在 uploads 下開資料夾或瀏覽別的模組附件
$ck5_module = xoops_getHandler('module')->getByDirname($mod_dir);
if (!$ck5_module || !xoops_getHandler('groupperm')->checkRight('module_read', $ck5_module->getVar('mid'), $xoopsUser->getGroups())) {
    ck5_fail('沒有使用此模組的權限', 403);
}

// 編輯器給的根目錄；使用者只能在它底下的子資料夾活動
$ck5_root_rel = "/uploads/{$mod_dir}/{$ck5_type}/" . ($subDir === '' ? '' : "{$subDir}/");
$ck5_rel      = $ck5_root_rel . ($path === '' ? '' : "{$path}/");
$ck5_path     = $path;

// 取得目前資料夾的實體路徑；$create 時不存在就建立。回傳 false 表示不存在或跑出 uploads
function ck5_current_dir($create = false)
{
    global $ck5_rel;
    $dir = XOOPS_ROOT_PATH . $ck5_rel;
    if ($create && !is_dir($dir) && !mkdir($dir, 0755, true)) {
        ck5_fail('無法建立資料夾', 500);
    }
    $real = realpath($dir);
    $base = realpath(XOOPS_ROOT_PATH . '/uploads');
    return $real !== false && $base !== false && strpos($real, $base . DIRECTORY_SEPARATOR) === 0 ? $real . DIRECTORY_SEPARATOR : false;
}

function ck5_url($name)
{
    global $ck5_rel;
    return XOOPS_URL . ck5_url_encode_path($ck5_rel . $name);
}

// 同名時加 _1、_2…
function ck5_unique_name($dir, $base, $ext)
{
    $name = "{$base}.{$ext}";
    for ($i = 1; file_exists($dir . $name); $i++) {
        $name = "{$base}_{$i}.{$ext}";
    }
    return $name;
}

// 改名、搬移、刪除只開放給該模組的管理員（會批次改資料庫）
function ck5_can_manage()
{
    global $xoopsUser, $ck5_module;
    return $xoopsUser->isAdmin($ck5_module->getVar('mid'));
}

// 給定目前資料夾下的名稱，回傳實體路徑與 uploads 起算的相對網址路徑（/uploads/…）
function ck5_item($name)
{
    global $ck5_rel;
    $dir = ck5_current_dir();
    if ($dir === false || !ck5_valid_segment($name) || !file_exists($dir . $name)) {
        ck5_fail('找不到檔案');
    }
    return [$dir . $name, $ck5_rel . $name . (is_dir($dir . $name) ? '/' : '')];
}

// TadUpFiles 管理的模組附件（{mod_dir}_files_center 有記錄的檔名），選檔器不可改名、搬移、刪除
function ck5_locked_names()
{
    global $xoopsDB, $mod_dir;
    static $names = null;
    if ($names === null) {
        $names = [];
        $table = $xoopsDB->prefix("{$mod_dir}_files_center");
        if ($xoopsDB->getRowsNum($xoopsDB->queryF("SHOW TABLES LIKE '" . $xoopsDB->escape($table) . "'"))) {
            $result = $xoopsDB->queryF("SELECT DISTINCT `file_name` FROM `{$table}`");
            while ([$name] = $xoopsDB->fetchRow($result)) {
                $names[$name] = true;
            }
        }
    }
    return $names;
}

// 檔案本身、或資料夾內任何檔案是模組附件，就鎖住
function ck5_is_locked($abs)
{
    $locked = ck5_locked_names();
    if (!is_dir($abs)) {
        return isset($locked[basename($abs)]);
    }
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($abs, FilesystemIterator::SKIP_DOTS)) as $f) {
        if (isset($locked[$f->getFilename()])) {
            return true;
        }
    }
    return false;
}

// 本模組 xoops_version 宣告的資料表裡，所有文字欄位 [表 => [欄位…]]
function ck5_text_columns()
{
    global $xoopsDB, $ck5_module;
    $cols = [];
    foreach ((array) $ck5_module->getInfo('tables') as $t) {
        $table  = $xoopsDB->prefix($t);
        $result = $xoopsDB->queryF("SHOW COLUMNS FROM `{$table}`");
        while ($result && $c = $xoopsDB->fetchArray($result)) {
            if (preg_match('/char|text/i', $c['Type'])) {
                $cols[$table][] = $c['Field'];
            }
        }
    }
    return $cols;
}

// 文章裡的網址可能是原字（/uploads/校慶/a.png）或編碼過（/uploads/%E6%A0%A1…）
function ck5_url_encode_path($rel)
{
    return implode('/', array_map('rawurlencode', explode('/', $rel)));
}

function ck5_url_forms($rel)
{
    return array_values(array_unique([$rel, ck5_url_encode_path($rel)]));
}

// 統計本模組資料表中引用到 $rel（/uploads/… 開頭）的筆數 [表 => 筆數]
function ck5_count_refs($rel)
{
    global $xoopsDB;
    $refs = [];
    foreach (ck5_text_columns() as $table => $cols) {
        $where = [];
        foreach ($cols as $c) {
            foreach (ck5_url_forms($rel) as $form) {
                $where[] = "`{$c}` LIKE '%" . $xoopsDB->escape(addcslashes($form, '\\%_')) . "%'";
            }
        }
        [$n] = $xoopsDB->fetchRow($xoopsDB->queryF("SELECT COUNT(*) FROM `{$table}` WHERE " . implode(' OR ', $where)));
        if ($n) {
            $refs[$table] = (int) $n;
        }
    }
    return $refs;
}

// 改名／搬移後，把本模組資料表中的舊網址換成新網址；回傳 [[舊, 新]…] 給前端同步更新編輯中的內容
// ponytail: 以字串取代，舊檔名剛好是別的檔名前綴時（a.png 與 a.png.bak）會一起被換，新上傳的檔名不含點所以不會發生
function ck5_replace_refs($old, $new)
{
    global $xoopsDB;
    // 原字對原字、編碼對編碼；兩種寫法相同（純英數）時只留一組
    $pairs = [[$old, $new]];
    if (ck5_url_encode_path($old) !== $old || ck5_url_encode_path($new) !== $new) {
        $pairs[] = [ck5_url_encode_path($old), ck5_url_encode_path($new)];
    }
    foreach (ck5_text_columns() as $table => $cols) {
        foreach ($cols as $c) {
            foreach ($pairs as [$from, $to]) {
                $f = $xoopsDB->escape($from);
                $xoopsDB->queryF("UPDATE `{$table}` SET `{$c}` = REPLACE(`{$c}`, '{$f}', '" . $xoopsDB->escape($to) . "')
                    WHERE `{$c}` LIKE '%" . $xoopsDB->escape(addcslashes($from, '\\%_')) . "%'");
            }
        }
    }
    return $pairs;
}

// 刪除檔案或整個資料夾；符號連結只刪連結本身，不進去刪它指向的內容
function ck5_remove($path)
{
    if (is_link($path) || !is_dir($path)) {
        return @unlink($path) || @rmdir($path); // Windows 的資料夾連結要用 rmdir
    }
    foreach (array_diff(scandir($path), ['.', '..']) as $name) {
        if (!ck5_remove($path . DIRECTORY_SEPARATOR . $name)) {
            return false;
        }
    }
    return rmdir($path);
}
