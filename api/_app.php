<?php

include 'PorterStemmer.php';

// check auth always

function where_hook($table) {
  $user_id = $_SESSION['user'];
  
  return "";  
}

function delete_hook($table, $id=0) {

}

function after_hook($results, $table, $id='', $table2='', $method='get') {

	return $results;
}


function updateStems() {
	$dbh = getdbh();
	
	$stmt = $dbh->prepare("SELECT id,root FROM vocab_words_wedt WHERE stem='' AND root!=''");
	$stmt->execute();
	
	
	
	$words = $stmt->fetchAll(PDO::FETCH_ASSOC);
	
	$upd = $dbh->prepare("UPDATE vocab_words_wedt SET stem=? WHERE id=?");
	foreach($words as $word) {
		$upd->execute(array(PorterStemmer::stem($word['root']), $word['id']));
	}
	
}

$app->post('/new-search', function() use ($app) {
	$dbh = getdbh();
	
	$text = $_POST['text'];
	$originalText = $text;
	
	updateStems();
	
	$text = preg_split('/[\\W]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
	
	$text = array_map(function($i) {
		return "'" . addslashes(PorterStemmer::stem($i)) . "'";
	}, $text);
	
	$text = implode(',', $text);
	
	$user = 0;
	if(isset($_SESSION['user']) && isset($_SESSION['user']['id']))
		$user = $_SESSION['user']['id'];
	else
		throw new Exception('Not logged in'); 
	

	if(!isset($_POST['grade'])) $_POST['grade'] = 6;
	$results = scan_text($originalText, $text, $_POST['grade']);
	
	// todo (maybe): don't even save if no on-grade results
	if(count($results)) {
		$stmt = $dbh->prepare("INSERT INTO vocab_searches (`date`, user_id, grade, text, stemmedtext,title,notes) VALUES (NOW(),?,?,?,?,?,?)");
		$stmt->execute(array($user, $_POST['grade'], $originalText, $text, "Grade {$_POST['grade']} search", substr($originalText,0,35)."..." ));
	}
	
	
	echo json_encode(array('success'=>true, 'id'=>$dbh->lastInsertId(), 'results'=>$results ));
});


$app->post('/update-search/:id', function($id) use ($app) {
	$dbh = getdbh();
	
	$user = 0;
	if(isset($_SESSION['user']) && isset($_SESSION['user']['id']))
		$user = $_SESSION['user']['id'];
	else
		throw new Exception('Not logged in'); 
	

		$stmt = $dbh->prepare("UPDATE vocab_searches SET title=?, author=?, notes=? WHERE id=? AND user_id=?");
		$stmt->execute(array($_POST['title'], $_POST['author'], $_POST['notes'], $id, $user));

	
	
	echo json_encode(array('success'=>true ));
});

$app->get('/get-profile', function() use ($app) {
	$dbh = getdbh();

	$user = 0;
	if(isset($_SESSION['user']) && isset($_SESSION['user']['id']))
		$user = $_SESSION['user']['id'];
	else
		throw new Exception('Not logged in'); 
	
	$stmt = $dbh->prepare("SELECT * FROM user WHERE id=?");
	
	$stmt->execute(array($user));
	
	$profile = $stmt->fetch(PDO::FETCH_ASSOC);
	
	if(!$user) throw new Exception('Expired session');
	
	 unset($profile['password']);
	 unset($profile['reset_token']);
	
	echo json_encode(array('success'=>true, 'profile'=>$profile ));
});

// strategy: avoid overstemming by first doing exact headword-to-original-text or headword-to-stemmed-original matches
// then removing them from the stems
function scan_text($originaltext, $stemmed, $grade) {
	$dbh = getdbh();

	$originaltext = preg_split('/[\\W]+/', $originaltext, -1, PREG_SPLIT_NO_EMPTY);
	
	$originaltext = array_map(function($i) {
		return "'" . addslashes($i) . "'";
	}, $originaltext);
	
	$originaltext = implode(',', $originaltext);
	
	if(!$stemmed) $stemmed = "''";
	
	$stmt = $dbh->prepare("SELECT DISTINCT stem FROM vocab_words_wedt WHERE (1 OR importance>0) AND (root IN ($originaltext) OR root IN ($stemmed))");
	$stmt->execute();
	$exactmatches = $stmt->fetchAll();
	
	$remaining_stemmed = $stemmed;
	foreach($exactmatches as $match) {
		$m = $match['stem'];
		$remaining_stemmed = str_replace("'$m'", "''", $remaining_stemmed);
	}
	
	$min_grade = $grade - 2;
	$max_grade = $grade + 2;
	
	$stmt = $dbh->prepare("SELECT id, root, stem, pos, advdef, advex, begdef, begex, importance, mingrade, maxgrade FROM vocab_words_wedt WHERE importance>0 AND mingrade<=$max_grade AND maxgrade>=$min_grade AND (advdef!='' OR begdef!='') AND (root IN ($originaltext) OR root IN ($stemmed) OR stem IN ($remaining_stemmed))");
	$stmt->execute(array());

	$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
	
	return $results;

}


$app->get('/scan-text/:id', function($id) use ($app) {
	$dbh = getdbh();
	
	$stmt = $dbh->prepare("SELECT title, author, `notes`, grade, `text`, stemmedtext FROM vocab_searches WHERE id=?");
	$stmt->execute(array($id));
	
	$text = $stmt->fetch(PDO::FETCH_ASSOC);
	
	if(!$text) throw new Exception('Search not found');
	
	$results = scan_text($text['text'], $text['stemmedtext'], $text['grade']);
	//$query = "SELECT id, root, stem, advdef, advex, begdef, begex, importance, mingrade, maxgrade FROM vocab_words_wedt WHERE importance > 0 AND stem IN ($text)";
	if($GLOBALS['env'] !== 'devatc') $query='';
	echo json_encode(array('success'=>true, 'results'=>$results, 'text'=>$text['text'], 'grade'=>$text['grade'], 'title'=>$text['title'],'author'=>$text['author'], 'notes'=>$text['notes'],  ));
});

$app->post('/logout', function() {
	session_destroy();
});