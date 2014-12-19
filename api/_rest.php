<?php

function options($id) {
	global $OPTIONS;
	 return $OPTIONS[$id];
}

function fetch_by_id($table, $id) {
	return fetch_by_key($table, $id, 'id');
}
function fetch_by_key($table, $id, $key, $pagination=false, $contextual_filter='') {
	$dbh = getdbh();
	$fields = '*';
	$table_ = escape_identifier($table);
	$key = escape_identifier($key);
	
	$count = options('count');
	$start = options('start');
	$sort = $pagination ? escape_identifier(options('sort')) : 'id';
	$reverse = (options('reverse') ? 'ASC' : 'DESC');
	
  $filter = where_hook($table);
	$stmt = $dbh->prepare("SELECT $fields FROM $table_ WHERE $key=? $filter $contextual_filter ORDER BY $sort $reverse" . ($pagination ? " LIMIT $start,$count" : ""));
	$stmt->execute(array($id));
	
	return $stmt->fetchAll(PDO::FETCH_ASSOC);
}


// Files
function save_data_url($data, $prefix='file') {
	$data = substr($data, strpos($data, ',')+1);
	$data = base64_decode($data);
	$fn = 'images/'.$prefix.'_'.md5($data).'.png';
	file_put_contents('../' . $fn, $data);
	return $fn;
}

function handle_files(&$params, $prefix='') {
	$prefix = basename($prefix);
	foreach($params as $k=>$v) {
		if(substr($k, -4) == 'file' && $v) {
			$params[$k] = save_data_url($v, $prefix);
		}
	}
}

function user_check(&$params, $table) {
	$dbh = getdbh();
	
	$table_ = escape_identifier($table);
	
	$useridcol = $dbh->query("SHOW COLUMNS FROM $table_ LIKE 'user_id'");
	if($useridcol->fetch()) {
		if(count($params))
			$params['user_id'] = $_SESSION['user'];
		return "AND `user_id`=" . $_SESSION['user'];
	}
	return "";
}


