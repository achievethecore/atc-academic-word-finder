/** @jsx React.DOM */

window.React = require('react/addons');
window._ = require('underscore');
window.Backbone = require('backbone');


var LandingView = require('./landingview');

var ResultsView = require('./resultsview');


var Modals = require('./modals');


window.refreshSaved = function() {
	var usdate = function(d)
		{
			d = d.split('-'); 
	  		return [d[1],d[2],d[0]].join('/'); 
		};
		
	$.getJSON('/vocab-saved-searches', function(data) 
	{
		$('#saved-lesson-data').empty();
		data.saved  = data.searches; // oh
				for(var d in data.saved)
				{ 
					data.saved[d].shared = !!(1*data.saved[d].shared);
	  				//data.saved[d].date = usdate(data.saved[d].date);
				};
		var tpl = Handlebars.compile($('#saved-tpl').html());
		
		
		$('#saved-lesson-data').html(tpl(data));
		if(data.saved.length)
		$('#saved-lesson-data table').tablesorter({
			sortList:(window.sort||[[0,1]]), 
			headers:{
				1:{sorter:'natext'},2:{sorter:'natext'},3:{sorter:'natext'},4:{sorter:'natext'},
				5:{sorter:false},6:{sorter:false},7:{sorter:false},8:{sorter:false}
			} 
		}).bind('sortEnd', function(e) {
			window.sort = this.config.sortList; // saved ref? to sort setting for next table load
		});
		
		$('#saved-lesson-data').off('click', '.btn-email').on('click', '.btn-email', function() {
			$('#emailModal').modal();
			Modals.bindEmailModal($(this).attr('href').replace('#',''), $('.btn-email').eq(0).parent().parent().find('.btn-viewdetail')[0].href);
			return false;
		});
		
		$('#saved-lesson-data').off('click', '.btn-viewdetail').on('click', '.btn-viewdetail', function() {
			_gaq.push(['_trackEvent', 'Data', 'Load Saved Data' ]);
			$('#savedModal').modal('hide');
		});
		
		var areyousure = function(closest, after)
		{
			return function() {
		    	$(this).closest(closest).append('<div class="indicatormenu areyousure">Are you sure? <a href="#" class="btn btn-go btn-goforward">Yes</a></div>');
		    	$(this).closest(closest).find('.indicatormenu').hide().fadeIn();
		    	
		    	$(this).closest(closest).find('.areyousure .btn-goforward').click(after);
		        
		        setTimeout(function() {
		        $('html').one('click', function() {  $('.areyousure').remove(); });
		        },10);
		      
		        return false;
		  	}; 
		};
		
		$('#saved-lesson-data').off('click', '.btn-delete').on('click', '.btn-delete', areyousure('td', function() {
				_gaq.push(['_trackEvent', 'Data', 'Delete Saved Data' ]);
				var me = $(this).closest('td').find('.btn-delete'); 
				$.post('/vocab-delete-search', {id: me.attr('href').split(/#/)[1]}, function(data)
				{
					me.parent().parent().fadeOut();
				}, 'json'); 

				return false; 
		
		}));
				
	});
};


window.showMyAcct = function() {
		if(window.loggedin && !window.account) {
			window.loginCheck();
			setTimeout(showMyAcct, 200);
			return;
		}
		_gaq.push(['_trackEvent', 'UI', 'View Account Details']);
		
		var tpl = Handlebars.compile($('#myacct-tpl').html());
		$('.myacctArea').html(tpl(account.getprofile));
		
		    $(".btn-edit-profile").unbind('click').on("click", function()
		    {
		    	_gaq.push(['_trackEvent', 'UI', 'Edit Account Details']);
		        //populate register form
		        $("#firstname").val(account.getprofile.name.split(" ")[0]);
		        $("#lastname").val(account.getprofile.name.split(" ")[1]);

		        $(".grade-group input[type=checkbox]").each(function()
		        {
		            var gradearr = account.getprofile.grades.split(",");

		            if($.inArray($(this).val(),gradearr)>-1) $(this).prop("checked",true);
		        });

		        $('#registerform #password').val('');
		        
		        $("#role").val(account.getprofile.role);
		        $("#subject").val(account.getprofile.subject);
		        $("#email").val(account.getprofile.email);
		        $("#school").val(account.getprofile.school);
		        $("#state").val(account.getprofile.state);
		        $("#city").val(account.getprofile.city);
		        $("#newsletter").attr("checked",((account.getprofile.optin == "0")? false : true));

		        $("#registerModal").removeClass("myacct").addClass("edit");

		        return false;
		    });
		    
		$('#registerModal').addClass('myacct').modal();
};


var App = React.createClass({
	getInitialState: function() {
		return {
			"activeView": "noroute",
			clearEntries: 0,
			grade: "",
			text: "",
			resultsID: "",
			errors: [],
			// these will only be set when doing a new search. when resultsDataID==resultsID results are fresh and we can skip an extra round-trip.
			resultsData: undefined,
			resultsDataID: undefined
		}
	},
	
	componentDidMount: function() {
		window.theApp = this;
		var Router = Backbone.Router.extend({
			
			routes: {
				"about": "about",
				"login(/(*prev))": "login",
				"register(/(*prev))": "register",
				"new": "createnew",
				"continue": "continuesaved",
				"results/:id": "results",
				"editprofile": "editprofile",
				"": "landing"
			},
			
		});
		
		var loggedOutRoutes = {
			login: true,
			register: true
		};
		var loggedInRoutes = {
			continuesaved: true,
			editprofile: true,
		};
		
		window.router = new Router();
		var app = this;

		router.on("route", function(route, params) {
			if(window.console) console.log("route:"+route);
			
			if(loggedOutRoutes[route] && window.loggedin) {
				router.navigate(params[0], {trigger: true, replace: true});
				return;
			}
			
			if(loggedInRoutes[route] && !window.loggedin) {
				router.navigate('login/' + Backbone.history.getFragment(), {trigger: true, replace: true});
				return;
			}
			if(route === "register") {
				$('#registerModal').modal();
				$('#registerModal').on('hide.bs.modal', function() {
					router.navigate(params[0], {trigger: true, replace: true});
					$('#registerModal').off('hide.bs.modal');
					loginCheck();
				});
			}
			if(route == "continuesaved") {
				$('#savedModal').modal();
				history.back();
			}
			
			if(route === "results") {
				app.setState({resultsID: params[0]});
			}
			
			
			$('body').attr('class', $('body').attr('class').replace(/view-\w+/, '') ).addClass('view-'+route);
			
			 if(window._gaq) 
			 	_gaq.push(['_trackPageview', '/academic-word-finder/' + Backbone.history.getFragment() ]);

			app.setState({activeView:route});
		});

		Backbone.history.start();
		
		Modals.initRegisterModal();
		

		window.loginCheck = function() {
			$.getJSON('api/get-profile', function(data) {
				if(data.success) {
					if(!window.loggedin) window.refreshSaved();
					window.loggedin = true;
					$('body').addClass('loggedin');
					
					window.account = {getprofile:data.profile};
	                account.getprofile.optin = (account.getprofile.optin == "1") ? true : false;
	                account.username = data.profile.name;
	                
	                $('body').trigger('login', account);
	                
					if(/register|login/.test(Backbone.history.getFragment()) && !app.maybeSubmitSearch()) {
						router.navigate(Backbone.history.getFragment().replace(/^(register\/)?login\//, ''), {trigger: true});
						
						data.user = data.profile;
						trackprof = [data.user.id, data.user.role, data.user.subject, data.user.grades, (/register/.test(Backbone.history.getFragment())?'Register':'Login')];
					     var trnames = ['uid', 'role', 'subject', 'grades'];
					     for(var i=1;i<=4;i++)
					        _gaq.push(['_setCustomVar', i, trnames[i-1], trackprof[i-1], 2]);
                        _gaq.push(['_trackEvent', 'Account', trackprof[4]]);
                        
					}	
				}
			}).error(function() {
				window.loggedin = false; 
				$('body').removeClass('loggedin');
			});
		}
		loginCheck();
		setInterval(loginCheck, 10000);

		
	},
	
	maybeSubmitSearch: function() {
		if(this.state.grade && this.state.text && window.loggedin) {
			$.post('api/new-search', this.state, (function(data) {
				if(
					data.results.length && 
					_.find(data.results, (function(r) { return ~~this.state.grade >= ~~r.mingrade && ~~this.state.grade <= ~~r.maxgrade; } ).bind(this))
					) {
					this.setState({resultsData:data.results, resultsDataID:data.id, resultsID:data.id});
					router.navigate('/results/' + data.id, {trigger: true});
					window.refreshSaved();
					$('#saveModal').modal();
					$('#saveModal input:eq(0)').val('');
					$('#saveModal input:eq(1)').val('');
					$('#saveModal textarea:eq(0)').val('');
					Modals.bindSaveModal(data.id);
				}
				else {
					this.setState({errors:[{id:"text", message:"There were no tier two words found in the article for the selected grade level. Please try a different text or grade level."}]});
					router.navigate('/new', {trigger: true}); // could have been on login screen
				}				
			}).bind(this), 'json');	
			return true;
		}
		return false;
	},
	
	handleEntry: function(grade, text) {
		
		this.setState({ grade:grade, text: text }, this.maybeSubmitSearch);
		
		if(!window.loggedin) {
			router.navigate('login/new', {trigger: true});
		}

		return false;
	},
	
	handleLogin: function() {
		$.post( '/login', $('.landing-login input').serialize(), (function(data) {
			if(data.errors) { 
				this.setState({errors:data.errors});
				return false;
			}
			window.loggedin = true;
			$('body').addClass('loggedin');
			refreshSaved();
			
			

			if(!this.maybeSubmitSearch())
				router.navigate(Backbone.history.getFragment().replace(/^(register\/)?login\//, ''), {trigger: true});		
		
		}).bind(this), "json" );
		
		return false;
	},
	
	clearEntry: function() {
		this.setState({clearEntries:++this.state.clearEntries, errors:[] });
		location.href = '#new';
		return false;
	},
	
	render: function() {
		return (
			<div id="app" className={"view-" + this.state.activeView}>
				<LandingView clearKey={'landing-' + this.state.clearEntries} onEntrySubmit={this.handleEntry} onLogin={this.handleLogin} errors={this.state.errors} />
				<ResultsView onClearEntry={this.clearEntry} results={this.state.resultsID} resultsData={this.state.resultsData} resultsDataID={this.state.resultsDataID} text={this.state.text} grade={this.state.grade} />
			</div>
		);
	}
});


React.renderComponent(<App />, $('#main')[0]);

if(/wkhtmltopdf/.test(navigator.userAgent)) $('html').addClass('wkhtmltopdf');


$(window).on('scroll', function() {
	$('a.btt').toggleClass('shown', $(window).scrollTop() > 320);

});

$(document).on('click', 'a.btt', function() {
	$('html,body').animate({scrollTop:0}, 500);
	return false;
});