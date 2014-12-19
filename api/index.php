<?php

$GLOBALS['env'] = 'live';
if(strpos($_SERVER['SERVER_NAME'],'websitetestlink.com')!==FALSE || strpos($_SERVER['SERVER_NAME'],'dev.achievethecore.org')!==FALSE) {
	$GLOBALS['env'] = 'devatc';
	ini_set('display_errors','On');
	error_reporting(E_ALL ^ E_NOTICE);
}

function escape_identifier($str) {
	return '`' . str_replace('`', '``', $str) . '`';
}

$OPTIONS = array(
	'start' => 0,
	'count' => 15,
	'reverse' => '',
	'sort' => 'id',
);


	if(isset($_GET['start'])) { $OPTIONS['start'] = $_GET['start']; unset($_GET['start']); }
	if(isset($_GET['count'])) { $OPTIONS['count'] = $_GET['count']; unset($_GET['count']); }
	if(isset($_GET['reverse'])) { $OPTIONS['reverse'] = $_GET['reverse']; unset($_GET['reverse']); }
	if(isset($_GET['sort'])) { $OPTIONS['sort'] = $_GET['sort']; unset($_GET['sort']); }
	
	// delete real query string, slim would do this anyway
	$_SERVER['PATH_INFO'] = str_replace('?' . $_SERVER['QUERY_STRING'], '', $_SERVER['PATH_INFO']);
	$_SERVER['REQUEST_URI'] = str_replace('?' . $_SERVER['QUERY_STRING'], '', $_SERVER['REQUEST_URI']);
	// fake query string
	$_SERVER['QUERY_STRING'] = http_build_query($_GET);
	


session_start();



include_once '../../admin/db.php';

require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();
$app->config('debug', !!$_REQUEST['debug']);



$dbh = getdbh();

include '_app.php';

//include '_auth.php';
include '_rest.php';

$app->error(function (\Exception $e) use ($app) {
    echo json_encode(array('success'=>false, 'error'=>'You sent this: ' . var_export($app->request()->params(), true) . 'Error Message: ' . $e->getMessage())); 
});


function absolute_link_filter($buffer)
{
	$buffer = str_replace("file\":\"i", "file\":\"http://" . $_SERVER['SERVER_NAME'] . '/i', $buffer);
	$buffer = str_replace("file\":\"u", "file\":\"http://" . $_SERVER['SERVER_NAME'] . '/u', $buffer);
	return $buffer;
}

ob_start('ob_gzhandler');

//ob_start("absolute_link_filter");

$app->run();

ob_end_flush();