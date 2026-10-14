<?php
// CK5 選檔器（取代 elFinder）
// GET：列出目前資料夾 {path, can_manage, dirs[], files[]}
// POST op=…（name 為目前資料夾下的項目）：
//   mkdir   name                 建子資料夾（登入者）
//   refs    name                 統計引用筆數 {refs, locked}（模組管理員）
//   tree                         所有子資料夾清單，左側樹狀目錄用（登入者）
//   rename  name new_name        改名並更新文章中的網址（模組管理員）
//   move    name to              搬到 to（根目錄起算）並更新文章中的網址（模組管理員）
//   delete  name                 刪檔案或整個資料夾（模組管理員）
// 模組附件（files_center 有記錄者）一律不可改名、搬移、刪除
use Xmf\Request;

require __DIR__ . '/common.php';

$replaced = [];
$op       = Request::getString('op', '', 'POST');
if ($op !== '') {
    ck5_require_same_origin();
    if (!in_array($op, ['mkdir', 'tree'], true) && !ck5_can_manage()) {
        ck5_fail('只有模組管理員可以改名、搬移、刪除', 403);
    }
    $name = Request::getString('name', '', 'POST');
    $root = realpath(XOOPS_ROOT_PATH . $ck5_root_rel);

    if ($op === 'mkdir') {
        $dir  = ck5_current_dir(true);
        $name = ck5_clean_name($name, '');
        if ($dir === false || $name === '') {
            ck5_fail('名稱只能用中英文、數字、底線、連字號');
        }
        if (file_exists($dir . $name)) {
            ck5_fail('已有同名的檔案或資料夾');
        }
        if (!mkdir($dir . $name, 0755)) {
            ck5_fail('建立失敗', 500);
        }
    } elseif ($op === 'tree') {
        $dirs = [];
        if ($root !== false) {
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
            foreach ($it as $f) {
                $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($root) + 1));
                if ($f->isDir() && !preg_match('#(^|/)\.#', $rel)) {
                    $dirs[] = $rel;
                }
            }
        }
        natcasesort($dirs);
        die(json_encode(['dirs' => array_values($dirs)], JSON_UNESCAPED_UNICODE));
    } else {
        [$abs, $rel] = ck5_item($name);
        if ($op === 'refs') {
            die(json_encode(['refs' => ck5_count_refs($rel), 'locked' => ck5_is_locked($abs)], JSON_UNESCAPED_UNICODE));
        }
        if (ck5_is_locked($abs)) {
            ck5_fail('這是模組附件（或資料夾內含模組附件），請到原本的附件功能管理');
        }

        if ($op === 'delete') {
            if (!(is_dir($abs) ? ck5_rmdir($abs) : unlink($abs))) {
                ck5_fail('刪除失敗', 500);
            }
        } elseif ($op === 'rename' || $op === 'move') {
            if ($op === 'rename') {
                $new_name = ck5_clean_name(Request::getString('new_name', '', 'POST'), '');
                if ($new_name === '') {
                    ck5_fail('名稱只能用中英文、數字、底線、連字號');
                }
                if (is_file($abs) && ($ext = pathinfo($name, PATHINFO_EXTENSION)) !== '') {
                    $new_name .= ".{$ext}"; // 檔案保留原副檔名
                }
                $target_dir = dirname($abs) . DIRECTORY_SEPARATOR;
                $new_rel    = dirname($rel) . '/' . $new_name;
            } else {
                $to = trim(str_replace('\\', '/', Request::getString('to', '', 'POST')), '/');
                foreach ($to === '' ? [] : explode('/', $to) as $seg) {
                    if (!ck5_valid_segment($seg)) {
                        ck5_fail('目的資料夾錯誤');
                    }
                }
                $target = $root === false ? false : realpath($root . ($to === '' ? '' : DIRECTORY_SEPARATOR . $to));
                if ($target === false || !is_dir($target) || ($target !== $root && strpos($target, $root . DIRECTORY_SEPARATOR) !== 0)) {
                    ck5_fail('目的資料夾不存在');
                }
                if (is_dir($abs) && ($target === $abs || strpos($target, $abs . DIRECTORY_SEPARATOR) === 0)) {
                    ck5_fail('不能把資料夾搬到它自己裡面');
                }
                $new_name   = $name;
                $target_dir = $target . DIRECTORY_SEPARATOR;
                $new_rel    = $ck5_root_rel . ($to === '' ? '' : "{$to}/") . $new_name;
            }
            if (file_exists($target_dir . $new_name)) {
                ck5_fail('目的地已有同名的檔案或資料夾');
            }
            if (!rename($abs, $target_dir . $new_name)) {
                ck5_fail('操作失敗', 500);
            }
            $replaced = ck5_replace_refs($rel, $new_rel . (is_dir($target_dir . $new_name) ? '/' : ''));
        } else {
            ck5_fail('不支援的動作');
        }
    }
}

$image_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
$locked    = ck5_locked_names();
$dirs      = [];
$files     = [];
$dir       = ck5_current_dir();
if ($dir !== false) {
    foreach (new DirectoryIterator($dir) as $f) {
        $name = $f->getFilename();
        if ($f->isDot() || $name[0] === '.') {
            continue;
        }
        if ($f->isDir()) {
            $dirs[] = $name;
        } elseif ($ck5_type === 'file' || in_array(strtolower($f->getExtension()), $image_ext, true)) {
            $files[] = [
                'name'   => $name,
                'url'    => ck5_url($name),
                'size'   => $f->getSize(),
                'mtime'  => $f->getMTime(),
                'locked' => isset($locked[$name]),
            ];
        }
    }
}
natcasesort($dirs);
usort($files, fn($a, $b) => $b['mtime'] <=> $a['mtime']); // 新的在前

echo json_encode([
    'path'       => $ck5_path,
    'can_manage' => ck5_can_manage(),
    'dirs'       => array_values($dirs),
    'files'      => $files,
    'replaced'   => $replaced, // [[舊, 新]…]：前端用來同步更新編輯中的內容
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
