<?php
$modversion = [];

//---模組基本資訊---//
$modversion['name']        = 'Tad Base 工具包';
$modversion['version']     = $_SESSION['xoops_version'] >= 20511 ? '1.0.0-Stable' : '1.0';
$modversion['description'] = '支援PHP8以上的工具包';
$modversion['author']      = 'tad';
$modversion['credits']     = '';
$modversion['help']        = 'page=help';
$modversion['license']     = 'GNU GPL 2.0';
$modversion['license_url'] = 'www.gnu.org/licenses/gpl-2.0.html/';
$modversion['image']       = 'images/logo.png';
$modversion['dirname']     = basename(dirname(__FILE__));

//---模組狀態資訊---//
$modversion['release_date']        = '2025-09-10';
$modversion['module_website_url']  = 'https://github.com/tad0616/tad_base';
$modversion['module_website_name'] = 'github';
$modversion['module_status']       = 'release';
$modversion['author_website_url']  = 'https://www.tad0616.net';
$modversion['author_website_name'] = 'Tad';
$modversion['min_php']             = 8.3;

//---paypal資訊---//
$modversion['paypal'] = [
    'business' => 'tad0616@gmail.com',
    'item_name' => 'Donation : Tad',
    'amount' => 10,
    'currency_code' => 'USD',
];

//---後台使用系統選單---//
$modversion['system_menu'] = 1;

//---模組資料表架構---//
// $modversion['sqlfile']['mysql'] = 'sql/mysql.sql';
// $modversion['tables'] = [];

//---後台管理介面設定---//
$modversion['hasAdmin']   = 1;
$modversion['adminindex'] = 'admin/index.php';
$modversion['adminmenu']  = 'admin/menu.php';

//---前台主選單設定---//
$modversion['hasMain'] = 0;
// $modversion['sub'][] = ['name' => '子選項文字', 'url' => '子選項連結位址'];

//---模組自動功能---//
// $modversion['onInstall'] = "include/onInstall.php";
// $modversion['onUpdate'] = "include/onUpdate.php";
// $modversion['onUninstall'] = "include/onUninstall.php";

//---樣板設定---//
$modversion['templates'][] = ['file' => 'tad_base_admin.tpl', 'description' => '後台共同樣板'];
$modversion['templates'][] = ['file' => 'tad_base_index.tpl', 'description' => '前台共同樣板'];

//---搜尋---//
// $modversion['hasSearch'] = 1;
// $modversion['search'] = ['file' => 'include/search.php', 'func' => '搜尋函數名稱'];

//---區塊設定---//
// $modversion['blocks'][] = [
//     'file' => '區塊檔.php',
//     'name' => '區塊名稱',
//     'description' => '區塊說明',
//     'show_func' => '執行區塊函數名稱',
//     'template' => '區塊樣板.tpl',
//     'edit_func' => '編輯區塊函數名稱',
//     'options' => '設定值1|設定值2',
// ];

//---偏好設定---//
// $modversion['config'][] = [
//     'name' => '偏好設定名稱（英文）',
//     'title' => '_MI_偏好設定標題_常數',
//     'description' => '_MI_偏好設定說明_常數',
//     'formtype' => '輸入表單類型',
//     'valuetype' => '輸入值類型',
//     'default' => '預設值',
// ];

//---評論---//
// $modversion['hasComments'] = 1;
// $modversion['comments'][] = ['pageName' => '單一頁面.php', 'itemName' => '主編號'];

//---通知---//
// $modversion['hasNotification'] = 1;
