/** @jsx React.DOM */


var React = require('react');

var Toolbar = require('./toolbar');
var Dropdown = require('./dropdown');
var Modals = require('./modals');

var PorterStemmer = require('./PorterStemmer');

//var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

module.exports = React.createClass({
	getInitialState: function() { 
		return {
			showingAll: false,
			beforeCut: this.props.text.substr(0,1000),
			afterCut: "",
			results: [],
			showCount: 15,
			filter: "all",
			sort: "ioa",
			selectedWord: ""
		};
	},
	
	sortOptions: [
		{value:"az",label: "A-Z"},
		{value:"za",label: "Z-A"},
		{value:"ioa",label: "In Order of Appearance"},
		{value:"grade",label: "Grade"}
	],
	
	componentDidMount: function() {

	},
	
	logOut: function() {
		$.post('api/logout', function() {
			location.href = '.';
			location.reload();
			return false;
		});
	},
	
	showMoreResults: function() {
		this.setState({ showCount: this.state.showCount+15 });
	},
	
	scrollToResult: function(result, attempt) {
		var offset = $('#result-'+result.id).offset();
		if(offset) {
			this.setState({ selectedWord: result.stem });
			
			$('html, body').animate({scrollTop: offset.top - 180 });
		}
		else {
			if(attempt === 1) return false;
			this.setState({ selectedWord: result.root, filter: result.gradeCmp, showCount: this.state.results.length+1 }, (function() {
				this.scrollToResult(result, 1);
			}).bind(this));
		}
		return false;
	},
	
	chooseSort: function(sort, event) {
		this.setState({ sort:sort, selectedWord: "" });
		return false;
	},
	
	
	gradeCmp: function(result, grade) {
		if(parseInt(result.mingrade) > parseInt(grade)) return "above";
		if(parseInt(result.maxgrade) < parseInt(grade)) return "below";
		return "on";
	},
	
	updateTextCuts: function() {
		var before, after;
		if(this.props.text.length > 1000) {
			before = this.props.text.substr(0, 1000).replace(/\s+\S+$/, '');
			after = this.props.text.replace(before, '');
		}
		else {
			before = this.props.text;
			after = '';
		}
		this.setState({beforeCut:before, afterCut:after});

	},
	
	stemWord: PorterStemmer,
	
	
	highlightText: function(text) {
		if(!this.inverted_results) return text; // still waiting on results
		var words = text.split(/([\n]|[^\w\n]+)/);
		var output = [];
		var lastNodeWasText = false;
		for(var i=0;i<words.length;i++) {
			var stem = this.stemWord(words[i]).toLowerCase();
			if(this.inverted_results[stem] === undefined) // focus -> focu
				stem = this.stemWord(stem);
			if(this.inverted_results[stem] !== undefined) {
				output[output.length] = <a href="#" onClick={this.scrollToResult.bind(this,this.state.results[this.inverted_results[stem]])} key={i} className={this.state.results[this.inverted_results[stem]].gradeCmp}>{words[i]}</a>;
				lastNodeWasText = false;
			}
			else if(/\n/.test(words[i])) {
				output[output.length] = <br />;
				lastNodeWasText = false;
			}
			else {
				if(lastNodeWasText) {
					output[output.length - 1] += words[i];
				}
				else
					output[output.length] = words[i];
				lastNodeWasText = true;
			}
		}
		return output;
	},
	
	processResults: function(results) {
		this.inverted_results = {};
		_.each(results, (function(e,i) { 
			results[i].gradeCmp = this.gradeCmp(results[i], this.props.grade); 
			if(this.inverted_results[this.stemWord(results[i].root)] === undefined) // prefer first one
				this.inverted_results[this.stemWord(results[i].root)] = i; 
		}).bind(this));
		this.setState({results:results});
		this.updateTextCuts();
	},
	
	componentWillReceiveProps: function(next) {
		if(this.props.results !== next.results) {
			if(next.resultsData && next.resultsDataID==next.results) {
				this.processResults(next.resultsData);
				return;
			}
			$.getJSON('api/scan-text/' + next.results, (function(data) {
				if(!this.isMounted()) return;
				this.props.grade = data.grade;
				this.props.text = data.text;
				$('#saveModal input:eq(0)').val(data.title);
				$('#saveModal input:eq(1)').val(data.author);
				$('#saveModal textarea:eq(0)').val(data.notes);
				this.processResults(data.results);
				if($('html').hasClass('wkhtmltopdf')) this.setState({showCount:2000});
				window.status = 'ready';
				setTimeout(function() { window.status = 'ready'}, 200);

			}).bind(this));
		} 
		
	},
	
	componentDidUpdate: function(prevProps, prevState) {
		$('sup').tooltip({container:'.results'});
		if(prevState.filter !== this.state.filter) {
			$('#app tbody').hide().fadeIn();
		}
	},
		
	gradeOrdinal: function() {
		if(this.props.grade == '1') return this.props.grade+'st';
		if(this.props.grade == '2') return this.props.grade+'nd';
		if(this.props.grade == '3') return this.props.grade+'rd';
		if(this.props.grade == 'K') return this.props.grade;
		return this.props.grade + 'th';
	},
	
	nthGrade: function() {
		var ordinal = this.gradeOrdinal();
		if(ordinal == 'K') return "Kindergarten";
		return ordinal + ' grade';
	},
	
	
	preferredMeaning: function(word) {
		if(this.props.grade >= 9)
			return word.advdef || word.begdef;
		return word.begdef || word.advdef;
	},
	
	preferredExample: function(word) {
		if(this.props.grade >= 9)
			return word.advex || word.begex;
		return word.begex || word.advex;
	},
	
	gradeRange: function(r) {
		if(r.mingrade && r.mingrade != r.maxgrade) {
			return r.mingrade + '\u2013' + r.maxgrade;
		}
		return r.mingrade;
	},
	
	getSortedResults: function() {
		var sortedResults = _.sortBy(this.state.results, (function(a) {
			if(this.state.sort == 'az' || this.state.sort == 'za') return a.root;
			if(this.state.sort == 'ioa') {
				var i = this.props.text.toLowerCase().indexOf(a.stem);
				if(i < 0) i = this.props.text.toLowerCase().indexOf(a.root);
				if(i < 0) return 999999; // not found -> last
				return i;
			}
			if(this.state.sort == 'grade') return parseInt(a.mingrade);
			if(window.console) console.log("unrecognized sort option!");
			return a.root;
		}).bind(this));
		
		if(this.state.sort == 'za') sortedResults.reverse();
			
		return sortedResults;
	},
	
	getFilteredResultsPage: function() {
		var results = [];
		var sortedResults = this.getSortedResults();
		
		if(this.state.filter != "all")
			sortedResults = _.where(sortedResults, {gradeCmp: this.state.filter});
		
		var wordCount = 0;
		var lastWord = {};
		for(var i=0;i<sortedResults.length;i++) {
			if(wordCount >=  this.state.showCount) break;
			var r = sortedResults[i];
			
			if(r.root != lastWord.root) wordCount++;
			results[i] = <tr key={r.id} id={'result-'+r.id} className={(this.state.selectedWord==r.stem)&&'sel'}>
				<td data-importance={r.importance}>{(r.root != lastWord.root) && r.root}</td>
				<td>{(r.root != lastWord.root || r.mingrade != lastWord.mingrade) && this.gradeRange(r)}</td>
				<td>{r.pos.replace(/(in)?transitive /,'')}</td>
				<td>{this.preferredMeaning(r)}</td>
				<td>{this.preferredExample(r).split('   ;   ').map(function(a){return <div>{a}</div> })}</td>
				</tr>;
			lastWord = r;
		}
		
		if(results.length == 0) {
			results[0] = <tr key="sorry"><td colSpan="3">There were no results found for this grade range. Please try a different text, or change the filter.</td></tr>;
		}
		return results;
	},
	
	actionEmail: function(event) {
		$('#emailModal').modal();
		Modals.bindEmailModal(this.props.results, location.href);
		
		//$.post( site.root_uri + '/vocab-mail', { 'body': '<div class="row details">'+$details.html()+"</div><div class='loaddata'>"+$body.html(), 'comments':nl2br($("#emailform textarea").val())+'<br>', 'copyme':$('#email_copyme:checked:visible').length, 'mailto': $("#emailform input").val() }, function() {}, "json" );
	},
	actionExport: function(event) {
		$('#exportModal').modal();
		var params = {};
		params.text = $('.beforecut').html() + $('.aftercut').html();
		params.grade = this.props.grade;
		var self = this;
		var makeGrade = function(prefix,num,g) {
			var seen = {};
			return JSON.stringify({
				gradePrefix: prefix,
				gradeNum: num,
				words: _.where(self.getSortedResults(), {gradeCmp:prefix.toLowerCase()}).map(function(w) {
					return {
						gradeClass: "",
						word: ((w.root in seen) ? '' : (seen[w.root]=w.root) ),
						sense: self.preferredMeaning(w),
						example: self.preferredExample(w),
						grade: self.gradeRange(w).replace('\u2013', '-'),
						pos: w.pos
					};
					})
				});
				
		};
		params.selectedGrade = makeGrade("On", this.props.grade);
		params.aboveGrade = makeGrade("Above", this.props.grade);
		params.belowGrade = makeGrade("Below", this.props.grade);
		
		Modals.bindExportModal(this.props.results, params);
	},
	actionPrint: function(event) {
		_gaq.push(['_trackEvent', 'UI', 'Print']);
		window.print();
	},
	actionSave: function(event) {
		$('#saveModal').modal();
		Modals.bindSaveModal(this.props.results);
	},

	uniqueWords: function(array) {
		return _.uniq(array, false, function(a) { return a.root });
	},
	
	render: function() {
		return (		
		                <div className={'results ' +  (this.state.results.length ? 'loaded':'') }>
		                	<div className="fixednav">
		                		<Toolbar />
		                	</div>
		                    <h2>You've selected {this.nthGrade()} and have entered the following text:</h2>
		                    <div className={"results-text " + (this.state.showingAll ? 'showall ' : ' ') + (this.state.afterCut ? 'hascut ' : ' ')}>
			                    <p><span className="beforecut">{this.highlightText(this.state.beforeCut)}</span>
			                    <span className="aftercut">{this.highlightText(this.state.afterCut)}</span></p>
			                    <button className="btn" onClick={this.setState.bind(this, {showingAll:!this.state.showingAll}, null)}>{this.state.showingAll ? 'SHOW LESS TEXT' : 'SHOW ALL TEXT'}</button>
		                    </div>
		                    
		                    <div className="results-summary">
		                    	<h3><span>{this.uniqueWords(this.state.results).length}</span> Results</h3>
		                    	<div className="attrib">Definitions and examples provided by <a href="http://wordsmyth.net" target="_blank">wordsmyth</a></div>
		                    	<div className="actions">
		                    		<button onClick={this.props.onClearEntry} className="btn plusbtn"><span></span><data>Start New Entry</data></button>
		                    		<button onClick={this.actionSave} className="btn detailsbtn">Entry Details</button>
		                    		<button onClick={this.actionEmail} className="btn iconbtn">Q</button>
		                    		<button onClick={this.actionExport} style={{fontSize:19, lineHeight:'27px'}} className="btn iconbtn">z</button>
		                    		<button onClick={this.actionPrint} className="btn iconbtn">P</button>
		                    		
		                    	</div>
		                    </div>
		                    <div className={'results-filter ' + 'filter-' + this.state.filter}>
		                    	<label>Filter:</label>
		                    	<button className="all" onClick={this.setState.bind(this, {filter:"all"}, null)}>ALL WORDS (<span>{this.uniqueWords(this.state.results).length})</span></button>
		                    	<button className="below" onClick={this.setState.bind(this, {filter:"below"}, null)}>BELOW GRADE LEVEL (<span>{this.uniqueWords(_.where(this.state.results,{gradeCmp:"below"})).length}</span>)</button>
		                    	<button className="on" onClick={this.setState.bind(this, {filter:"on"}, null)}>ON GRADE LEVEL (<span>{this.uniqueWords(_.where(this.state.results,{gradeCmp:"on"})).length}</span>)</button>
		                    	<button className="above" onClick={this.setState.bind(this, {filter:"above"}, null)}>ABOVE GRADE LEVEL (<span>{this.uniqueWords(_.where(this.state.results,{gradeCmp:"above"})).length}</span>)</button>
		                    </div>
		                    <div className="results-sort">
		                    	<label>Sort:</label>
		                    	<div className="sort-widget">
		                    		<Dropdown className='sort-dropdown' onChange={this.chooseSort} options={this.sortOptions} value={this.state.sort} />
		                    		{/*
				                    <div className={"dropdown sort-dropdown "+(this.state.dropdownOpen?'open':'')} id="dropdown-sort">
				                        <a href="#" data-toggle="dropdown" onClick={this.toggleDropdown} className="toggle"><data>{_.find(this.sortOptions, {value:this.state.sort}).label}</data><span>&#8217;</span></a>
				                        <ul className="dropdown-menu">
				                        {
											_.reject(this.sortOptions,function(e) { return e.value == this.state.sort }).map((function(e) {
												return <li key={e.value}><a href="#" onClick={this.chooseSort.bind(this, e.value)}>{e.label}</a></li>;
											}).bind(this))
										}
				                        </ul>
				                    </div>
				                    */ }
		                    	</div>
		                    </div>
		                    <table style={{minWidth:880}}>
		                    	<thead><tr><th style={{width:50}}>Word</th><th style={{width:90}}>Grade Range</th><th style={{width:110}}>Part of Speech</th><th style={{width:165}}>Meaning</th><th style={{width:330}}>Example Sentence</th></tr></thead>
		                    	
		                    		<tbody>
		                    		{this.getFilteredResultsPage()}
		                    		</tbody>
		                    	
		                    </table>
		                    {
								(this.uniqueWords(this.state.results).length >= this.state.showCount) && <button className="btn loadmore" onClick={this.showMoreResults}>LOAD MORE RESULTS</button>
							}
		                </div>
		);
	}
});