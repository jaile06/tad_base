<?php
// CK5 圖片上傳（SimpleUploadAdapter）與外站圖片轉存（?url=）
// 回傳 {url} 或 {error:{message}}；存到 uploads/{mod_dir}/image/{subDir}/
use Xmf\Request;

require_once dirname(__DIR__, 4) . '/mainfile.php';
header('Content-Type: application/json; charset=utf-8');

const CK5_MAX_WIDTH  = 1920;       // 超過此寬度的圖片等比縮小（像素），要調就改這裡
const CK5_MAX_PIXELS = 40000000;   // 超過 4000 萬像素不處理，避免 GD 吃光記憶體

function ck5_fail($message, $code = 400)
{
    http_response_code($code);
    die(json_encode(['error' => ['message' => $message]], JSON_UNESCAPED_UNICODE));
}

function ck5_same_site($url)
{
    $a = parse_url((string) $url);
    $b = parse_url(XOOPS_URL);
    $port = fn($p) => $p['port'] ?? (strtolower($p['scheme'] ?? '') === 'https' ? 443 : 80);
    return !empty($a['host']) && !empty($b['host'])
    && strtolower($a['scheme'] ?? '') === strtolower($b['scheme'])
    && strtolower($a['host']) === strtolower($b['host'])
    && $port($a) === $port($b);
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

if (!$xoopsUser) {
    ck5_fail('請先登入', 403);
}
// 只接受本站發出的請求（Origin 優先，沒有才看 Referer）
$from = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if (!ck5_same_site($from)) {
    ck5_fail('非法調用', 403);
}

$mod_dir = Request::getString('mod_dir');
$subDir  = trim(str_replace('\\', '/', Request::getString('subDir')), '/');
if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $mod_dir) || !preg_match('/^[a-zA-Z0-9_\-\/]*$/', $subDir) || strpos($subDir, '..') !== false) {
    ck5_fail('參數錯誤');
}
$rel = "/uploads/{$mod_dir}/image/" . ($subDir === '' ? '' : "{$subDir}/");
$dir = XOOPS_ROOT_PATH . $rel;
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    ck5_fail('無法建立上傳目錄', 500);
}
$name = date('YmdHis_') . bin2hex(random_bytes(4));

if (isset($_FILES['upload'])) {
    $file = $_FILES['upload'];
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        ck5_fail('上傳失敗');
    }
    $ext = ck5_image_ext(@getimagesize($file['tmp_name']));
    if (!$ext) {
        ck5_fail('只接受 JPG、PNG、GIF、WebP、AVIF 圖片');
    }
    if (!move_uploaded_file($file['tmp_name'], "{$dir}{$name}.{$ext}")) {
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
    if (file_put_contents("{$dir}{$name}.{$ext}", $data, LOCK_EX) === false) {
        ck5_fail('存檔失敗', 500);
    }
} else {
    ck5_fail('沒有收到檔案');
}

ck5_resize("{$dir}{$name}.{$ext}", $ext);
chmod("{$dir}{$name}.{$ext}", 0644);
echo json_encode(['url' => XOOPS_URL . "{$rel}{$name}.{$ext}"], JSON_UNESCAPED_SLASHES);
