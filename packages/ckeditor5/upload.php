<?php
// CK5 上傳：編輯器貼上／拖曳圖片（SimpleUploadAdapter）、選檔器上傳、外站圖片轉存（?url=）
// 參數 type=image|file、path=子資料夾；回傳 {url, name} 或 {error:{message}}
// 存到 uploads/{mod_dir}/{type}/{subDir}/{path}/，保留原檔名（點與特殊字元換成底線）
// 同名時依 conflict 參數：（未給）自動加編號；ask 回 409 {conflict:{name, can_replace}} 不存檔；
// rename 自動加編號；replace 覆蓋舊檔（網址不變，限模組管理員，模組附件不可覆蓋）
use Xmf\Request;

require __DIR__ . '/common.php';

const CK5_MAX_WIDTH  = 1920;       // 超過此寬度的圖片等比縮小（像素），要調就改這裡
const CK5_MAX_PIXELS = 40000000;   // 超過 4000 萬像素不處理，避免 GD 吃光記憶體
// 可執行或可夾帶 script 的格式：就算寫進 upload_ext.txt 也不收
const CK5_DENY_EXT = [
    'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'pht', 'phps', 'inc',
    'cgi', 'pl', 'py', 'rb', 'sh', 'bash', 'asp', 'aspx', 'jsp', 'jspx', 'cfm',
    'html', 'htm', 'xhtml', 'shtml', 'svg', 'svgz', 'xml', 'xsl', 'js', 'mjs', 'swf', 'htaccess', 'htpasswd', 'ini',
    'exe', 'com', 'bat', 'cmd', 'msi', 'scr', 'vbs', 'wsf', 'ps1', 'jar', 'dll',
];

// 一般檔案的副檔名白名單，讀自同目錄 upload_ext.txt（空白、逗號、換行分隔，# 為註解）
function ck5_file_ext()
{
    $text = str_replace("\xEF\xBB\xBF", '', (string) @file_get_contents(__DIR__ . '/upload_ext.txt')); // 記事本存檔可能帶 BOM
    $exts = preg_split('/[\s,]+/', strtolower(preg_replace('/#.*/', '', $text)), -1, PREG_SPLIT_NO_EMPTY);
    return array_diff(array_map(fn($e) => ltrim($e, '.'), $exts), CK5_DENY_EXT);
}

// 以內容判斷圖片格式，副檔名由格式決定（不信任原始檔名）；不收 SVG（可夾帶 script）
function ck5_image_ext($info)
{
    $map = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp', 'image/avif' => 'avif'];
    return $info && isset($map[$info['mime']]) ? $map[$info['mime']] : false;
}

// 依 EXIF 轉正（手機直拍照片），寬度超過 CK5_MAX_WIDTH 就等比縮小；都不需要時不重新編碼
// ponytail: 鏡像類 EXIF 方向（2/4/5/7）不處理
function ck5_resize($file, $ext)
{
    $codec = [
        'jpg'  => ['imagecreatefromjpeg', fn($im, $f) => imagejpeg($im, $f, 85)],
        'png'  => ['imagecreatefrompng', fn($im, $f) => imagepng($im, $f, 6)],
        'gif'  => ['imagecreatefromgif', fn($im, $f) => imagegif($im, $f)],
        'webp' => ['imagecreatefromwebp', fn($im, $f) => imagewebp($im, $f, 85)],
        'avif' => ['imagecreatefromavif', fn($im, $f) => imageavif($im, $f, 60)],
    ];
    $info = @getimagesize($file);
    if (!isset($codec[$ext]) || !function_exists($codec[$ext][0]) || !$info || $info[0] * $info[1] > CK5_MAX_PIXELS) {
        return;
    }
    if ($ext === 'gif' && $info[0] > CK5_MAX_WIDTH && class_exists('Imagick') && ck5_gif_resize_imagick($file)) {
        return;
    }
    $rotate = 0;
    if ($ext === 'jpg' && function_exists('exif_read_data')) {
        $rotate = [3 => 180, 6 => -90, 8 => 90][(int) (@exif_read_data($file)['Orientation'] ?? 1)] ?? 0;
    }
    if (!$rotate && $info[0] <= CK5_MAX_WIDTH) {
        return;
    }

    $im = @$codec[$ext][0]($file);
    if (!$im) {
        return;
    }
    if ($rotate) {
        $im = imagerotate($im, $rotate, 0);
    }
    $w = imagesx($im);
    $h = imagesy($im);
    if ($w > CK5_MAX_WIDTH) {
        $nh  = max(1, (int) round($h * CK5_MAX_WIDTH / $w));
        $dst = imagecreatetruecolor(CK5_MAX_WIDTH, $nh);
        imagealphablending($dst, false); // 保留 PNG/WebP 透明
        imagesavealpha($dst, true);
        if ($ext === 'gif') { // GIF 只有單一透明色，要指定給調色盤
            $clear = imagecolorallocatealpha($dst, 0, 0, 0, 127);
            imagefill($dst, 0, 0, $clear);
            imagecolortransparent($dst, $clear);
        }
        imagecopyresampled($dst, $im, 0, 0, 0, 0, CK5_MAX_WIDTH, $nh, $w, $h);
        $im = $dst;
    }
    // ponytail: 無 Imagick 時動畫 GIF 會變成第一格靜態圖，伺服器裝 php-imagick 即可保留動畫
    $codec[$ext][1]($im, $file);
}

// 動畫 GIF 逐格縮小（保留動畫）；失敗回傳 false 交給 GD
function ck5_gif_resize_imagick($file)
{
    try {
        $gif = (new Imagick($file))->coalesceImages();
        foreach ($gif as $frame) {
            $frame->resizeImage(CK5_MAX_WIDTH, 0, Imagick::FILTER_LANCZOS, 1);
            $frame->setImagePage(0, 0, 0, 0);
        }
        return $gif->deconstructImages()->writeImages($file, true);
    } catch (Exception $e) {
        return false;
    }
}

// 外站圖片：只允許 http/https 公網位址，連線鎖定到已檢查的 IP（防 DNS rebinding），不跟隨轉址
function ck5_fetch_remote($url, $maxBytes)
{
    $p = parse_url($url);
    if (empty($p['host']) || !in_array(strtolower($p['scheme'] ?? ''), ['http', 'https'], true)) {
        ck5_fail('網址格式錯誤');
    }
    if (!function_exists('curl_init')) {
        ck5_fail('伺服器未啟用 cURL', 500);
    }
    $host = trim($p['host'], '[]');
    $ips  = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : array_merge(
        array_column(@dns_get_record($host, DNS_A) ?: [], 'ip'),
        array_column(@dns_get_record($host, DNS_AAAA) ?: [], 'ipv6')
    );
    if (!$ips) {
        ck5_fail('無法解析網址');
    }
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            ck5_fail('不允許內部網路位址');
        }
    }
    $port = $p['port'] ?? (strtolower($p['scheme']) === 'https' ? 443 : 80);
    $ip   = strpos($ips[0], ':') !== false ? "[{$ips[0]}]" : $ips[0];

    $data = '';
    $ch   = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RESOLVE         => ["{$host}:{$port}:{$ip}"],
        CURLOPT_PROTOCOLS       => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_FOLLOWLOCATION  => false,
        CURLOPT_CONNECTTIMEOUT  => 5,
        CURLOPT_TIMEOUT         => 15,
        CURLOPT_USERAGENT       => 'XOOPS CKEditor5 image fetcher',
        CURLOPT_WRITEFUNCTION   => function ($ch, $chunk) use (&$data, $maxBytes) {
            $data .= $chunk;
            return strlen($data) > $maxBytes ? 0 : strlen($chunk);
        },
    ]);
    $ok   = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($ok === false || $code < 200 || $code >= 300 || $data === '') {
        ck5_fail('外站圖片下載失敗');
    }
    return $data;
}

ck5_require_same_origin();
$fallback = date('YmdHis_') . bin2hex(random_bytes(4));
$dir      = ck5_current_dir(true);
if ($dir === false) {
    ck5_fail('路徑錯誤');
}

if (isset($_FILES['upload'])) {
    $file = $_FILES['upload'];
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        ck5_fail($file['error'] === UPLOAD_ERR_INI_SIZE ? '檔案超過伺服器上傳大小限制' : '上傳失敗');
    }
    $base = ck5_clean_name(pathinfo($file['name'], PATHINFO_FILENAME), $fallback);
    // 圖片：副檔名由內容判斷；一般檔案：白名單
    $ext = ck5_image_ext(@getimagesize($file['tmp_name']));
    if ($ck5_type === 'file' && !$ext) {
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext === '' || !in_array($ext, ck5_file_ext(), true)) {
            ck5_fail('不接受 .' . $ext . ' 檔案');
        }
    }
    if (!$ext) {
        ck5_fail('只接受 JPG、PNG、GIF、WebP、AVIF 圖片');
    }
    $name     = "{$base}.{$ext}";
    $conflict = Request::getString('conflict');
    if (file_exists($dir . $name)) {
        $can_replace = is_file($dir . $name) && ck5_can_manage() && !ck5_is_locked($dir . $name);
        if ($conflict === 'ask') {
            http_response_code(409);
            die(json_encode(['conflict' => ['name' => $name, 'can_replace' => $can_replace]], JSON_UNESCAPED_UNICODE));
        }
        if ($conflict === 'replace') {
            if (!$can_replace) {
                ck5_fail(ck5_can_manage() ? '這是模組附件，不可覆蓋' : '只有模組管理員可以取代舊檔', 403);
            }
        } else {
            $name = ck5_unique_name($dir, $base, $ext);
        }
    }
    if (!move_uploaded_file($file['tmp_name'], $dir . $name)) {
        ck5_fail('存檔失敗', 500);
    }
} elseif (($url = Request::getString('url')) !== '') {
    if (ck5_same_site($url)) {
        die(json_encode(['url' => $url], JSON_UNESCAPED_SLASHES)); // 本站圖片不用轉存
    }
    $data = ck5_fetch_remote($url, 10 * 1024 * 1024);
    $ext  = ck5_image_ext(@getimagesizefromstring($data));
    if (!$ext) {
        ck5_fail('外站檔案不是支援的圖片');
    }
    $name = ck5_unique_name($dir, ck5_clean_name(pathinfo((string) parse_url($url, PHP_URL_PATH), PATHINFO_FILENAME), $fallback), $ext);
    if (file_put_contents($dir . $name, $data, LOCK_EX) === false) {
        ck5_fail('存檔失敗', 500);
    }
} else {
    ck5_fail('沒有收到檔案');
}

ck5_resize($dir . $name, $ext);
chmod($dir . $name, 0644);
echo json_encode(['url' => ck5_url($name), 'name' => $name], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
