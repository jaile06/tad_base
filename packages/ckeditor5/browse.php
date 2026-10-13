<?php
// CK5 選檔器（取代 elFinder）：只列出 uploads/{mod_dir}/{type}/{subDir} 的檔案，不提供任何寫入動作
use Xmf\Request;

require_once dirname(__DIR__, 4) . '/mainfile.php';
header('Content-Type: application/json; charset=utf-8');

if (!$xoopsUser) {
    http_response_code(403);
    die(json_encode(['error' => '請先登入']));
}

$type    = Request::getString('type') === 'image' ? 'image' : 'file';
$mod_dir = Request::getString('mod_dir');
$subDir  = trim(str_replace('\\', '/', Request::getString('subDir')), '/');
if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $mod_dir) || !preg_match('/^[a-zA-Z0-9_\-\/]*$/', $subDir) || strpos($subDir, '..') !== false) {
    http_response_code(400);
    die(json_encode(['error' => '參數錯誤']));
}

$rel  = "/uploads/{$mod_dir}/{$type}/" . ($subDir === '' ? '' : "{$subDir}/");
$dir  = realpath(XOOPS_ROOT_PATH . $rel);
$base = realpath(XOOPS_ROOT_PATH . '/uploads');
if ($dir === false || $base === false || strpos($dir, $base . DIRECTORY_SEPARATOR) !== 0) {
    die('[]'); // 目錄還不存在 = 沒有檔案
}

$image_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
$files     = [];
foreach (new DirectoryIterator($dir) as $f) {
    $name = $f->getFilename();
    if (!$f->isFile() || $name[0] === '.') {
        continue;
    }
    if ($type === 'image' && !in_array(strtolower($f->getExtension()), $image_ext, true)) {
        continue;
    }
    $files[] = [
        'name'  => $name,
        'url'   => XOOPS_URL . $rel . rawurlencode($name),
        'size'  => $f->getSize(),
        'mtime' => $f->getMTime(),
    ];
}
usort($files, fn($a, $b) => $b['mtime'] <=> $a['mtime']); // 新的在前

echo json_encode($files, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
