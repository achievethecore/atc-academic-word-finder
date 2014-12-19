<? 
	header("Content-type: application/rtf");
	$filename = "Vocab_Search_" . date("Y-m-d") . "_" . preg_replace('/[^a-zA-Z0-9]+/','_', returnAltGradeText($_REQUEST['grade']));
	header('Content-Disposition: attachment; filename="'.$filename.'.rtf"');
	
	

require 'Mustache/Autoloader.php';
Mustache_Autoloader::register();

$cellwidths = array(
1440*1,
1440*2,
1440*3,
1440*4,
1440*6
);

////////templates
$tplSearches = <<<EOD

\\fs30 {{gradePrefix}} Grade {{gradeNum}} \\fs24 \par

\\trowd
\cf1
\cellx{$cellwidths[0]}
\cellx{$cellwidths[1]}
\cellx{$cellwidths[2]}
\cellx{$cellwidths[3]}
\cellx{$cellwidths[4]}

\intbl\b WORD\cell
\intbl GRADE \cell
\intbl PART OF SPEECH \cell
\intbl SENSE \cell
\intbl EXAMPLE SENTENCE \b0 \cell
\\row
\pard

{{#words}}

\\trowd
\cf1
\cellx{$cellwidths[0]}
\cellx{$cellwidths[1]}
\cellx{$cellwidths[2]}
\cellx{$cellwidths[3]}
\cellx{$cellwidths[4]}

\intbl {{gradeClass}} {{word}} \cf1 \cell
\intbl {{grade}} \cell
\intbl {{pos}} \cell
\intbl {{sense}} \cell
\intbl {{example}} \cell
\\row

{{/words}}

\pard
\line

\\trowd
\\fs2
\cellx8640
\intbl \cell\\row
\pard
\\fs24
\line

EOD;

function returnAltGradeText($thegrade){
    $strGrade="";

    if(strtolower($thegrade) == "k"){
        return "Kindergarten";
    }else{
        switch($thegrade){
            case "1":
                $strGrade = "1st";
            break;
            case "2":
                $strGrade = "2nd";
            break;
            case "3":
                $strGrade = "3rd";
            break;
            default:
                $strGrade = $thegrade."th";
            break;
        }
    }

    return $strGrade." Grade";
}


	// the dynamic content - maybe set these in another file and then include rtf.php 
	$subject = 'English Language Arts';
	$grades = 'Grades 3-5';
	
	$details = 'Daily Lesson';
	
	$actions = array(
		array(
		'text' => 'Focus each lesson on...',
		'indicators' => array(
			'A majority of read aloud time is spent...',
			'The text(s) are at or above the complexity level expected for the grade and time in the school year.',
			'A majority of read aloud time is spent...',
		)
		),
		array(
		'text' => 'Employ questions and tasks that',
		'indicators' => array(
			'A majority of read aloud time is spent...',
			'The text(s) are at or above the complexity level expected for the grade and time in the school year.',
			'A majority of read aloud time is spent...',
		)
		),
	);
	
$selectedGradeJSON =json_decode($_REQUEST['selectedGrade'], true);
$aboveGradeJSON =json_decode($_REQUEST['aboveGrade'], true);
$belowGradeJSON =json_decode($_REQUEST['belowGrade'], true);
$multipleMeaningsJSON =json_decode($_REQUEST['multipleMeanings'], true);

	
	

$headerstuff = <<<EOD

\\fs30 You've selected {{replacegrade}} and have entered the following text:\\fs24\line
{{replacetextentered}} \line\line

EOD;

$toptext = $_REQUEST['text'];

$toptext = iconv("UTF-8", "ISO-8859-1//TRANSLIT", $toptext);

$toptext = str_replace("\n", "\\line\n", $toptext);
$toptext = preg_replace('/<a[^>]*below[^>]*>(.*?)<\\/a>/', '\\\\cf5\\\\ul $1\\\\cf1\\\\ul0 ', $toptext);
$toptext = preg_replace('/<a[^>]*above[^>]*>(.*?)<\\/a>/', '\\\\cf6\\\\ul $1\\\\cf1\\\\ul0 ', $toptext);
$toptext = preg_replace('/<a[^>]*on[^>]*>(.*?)<\\/a>/', '\\\\cf4\\\\ul $1\\\\cf1\\\\ul0 ', $toptext);
$toptext = preg_replace('/<span[^>]*>(.*?)<\\/span>/', '$1', $toptext);
$toptext = preg_replace('/<br[^>]*>/', "\\line\n", $toptext);
//$toptext = preg_replace('/<a[^>]*multiplemeaningsgrade[^>]*>(.*?)<\\/a>/', '\\\\cf7\\\\ul $1\\\\cf1\\\\ul0 ', $toptext);

$headerstuff = str_replace("{{replacegrade}}", returnAltGradeText($_REQUEST['grade']),$headerstuff);

$headerstuff = str_replace("{{replacetextentered}}", $toptext,$headerstuff);

$selected_rtf = "";
$above_rtf =  "";
$below_rtf = "";


$m = new Mustache_Engine;
if(count($selectedGradeJSON['words'])>0){
    $selected_rtf = $m->render($tplSearches, $selectedGradeJSON);
}

if(count($aboveGradeJSON['words'])>0){
    $above_rtf = $m->render($tplSearches, $aboveGradeJSON);
}

if(count($belowGradeJSON['words'])>0){
    $below_rtf = $m->render($tplSearches, $belowGradeJSON);
}
if(count($multipleMeaningsJSON['words'])>0){
    $mm_rtf = str_replace('Multiple Meanings Grade', 'Words with multiple senses', $m->render($tplSearches, $multipleMeaningsJSON));
}

$needles = array('selectedgrade', 'belowgrade', 'abovegrade', 'multiplemeanings');
$replacements = array('\cf4', '\cf5', '\cf6', '\cf7');
$selected_rtf = str_replace($needles, $replacements, $selected_rtf);
$above_rtf = str_replace($needles, $replacements, $above_rtf);
$below_rtf = str_replace($needles, $replacements, $below_rtf);
$mm_rtf = str_replace($needles, $replacements, $mm_rtf);

?>{\rtf1\ansi\deff0 {\fonttbl {\f0 \fswiss Arial;}}
<? /* All colors referenced go here - start with black, white, then green etc. */ ?>
{\colortbl;\red0\green0\blue0;\red255\green255\blue255;\red40\green105\blue73;\red36\green165\blue106;\red247\green145\blue45;\red211\green32\blue39;\red60\green80\blue240;}

<?= $headerstuff ?>

<?= $selected_rtf ?>

<?= $below_rtf ?>

<?= $above_rtf ?>

<?= $mm_rtf ?>



}