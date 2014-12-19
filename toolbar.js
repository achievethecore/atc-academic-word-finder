/** @jsx React.DOM */

var React = require('react');

module.exports = React.createClass({
	getInitialState: function() {
		return {
			dropdownOpen: false,
			closeTimeoutID: undefined,
			username: (window.account ? account.username : ''),
		}
	},

	handleLogin: function() {
		if(/login/.test(Backbone.history.getFragment())) return false;
		_gaq.push(['_trackEvent', 'UI', 'Show Login Form', 'Top Right']);
		router.navigate('login/' + Backbone.history.getFragment(), {trigger: true});
		return false;
	},
	
	handleRegister: function() {
		_gaq.push(['_trackEvent', 'UI', 'Show Register Form', 'Top Right']);
		router.navigate('register/' + Backbone.history.getFragment(), {trigger: true});
		return false;
	},
	
	showAccountInfo: function() {
		window.showMyAcct();
		return false;
	},
	showSaved: function() {
		_gaq.push(['_trackEvent', 'UI', 'Saved Data Dialog' ]);
		$('#savedModal').modal();
		return false;
	},
	
	handleAbout: function(event) {
		 _gaq.push(['_trackPageview', '/academic-word-finder/about' ]);
		$('#aboutModal').modal();
		return false;
	},
	
	handleLogout: function() {
		$.post('api/logout', function() {
			_gaq.push(['_trackEvent', 'Account', 'Logout']);
			location.href = '.';
			location.reload();
			return false;
		});
	},
	
	componentDidMount: function() {
			$('body').on('click touchend', (function(e) {
				if(!this.isMounted()) return;
				if($(e.target).closest('.dropdown').length) return;
				this.setState({ dropdownOpen: false });
			}).bind(this));
			
			$('body').on('login.atc', (function(e, account) {
				this.setState({ username: account.username });
			}).bind(this));
	},
	
	shouldComponentUpdate: function(nextProps, nextState) {
		return (this.state.dropdownOpen != nextState.dropdownOpen) || (this.state.username != nextState.username) ;
	},
	
	componentDidUpdate: function(prevProps, prevState) {
		if(this.state.dropdownOpen == prevState.dropdownOpen) return;
		if(this.state.closeTimeoutID && prevState.closeTimeoutID) {
			clearTimeout(this.state.closeTimeoutID);
			this.setState({closeTimeoutID: undefined});
		}
	},
	
	toggleDropdown: function() {
		//this.setState({ dropdownOpen: !this.state.dropdownOpen });
		
		return false;
	},
	
	showDropdown: function() {
		this.setState({ dropdownOpen: true });

		return false;
	},
	hideDropdown: function() {
		var t = setTimeout((function() {
			this.setState({ dropdownOpen: false });
		}).bind(this), 500);
		
		this.setState({ closeTimeoutID: t });
		
		return false;
	},
	
	render: function() {
		return (
            <div className="header">
                <div className="atc"><a href="/" target="_blank" className="logo-atc"></a><img src="imgs/AcademicWordFinder_logo_grey.svg" className="logo-grey" /><img src="imgs/AcademicWordFinder_logo_white.svg" className="logo-white" /></div>
                <div className="lr">
                	<a href="#" onClick={this.handleAbout} className="btn-about">ABOUT</a>
                	{ this.state.username ? 
                	<div className="profile-dropdown dropdown" onMouseEnter={this.showDropdown} onMouseLeave={this.hideDropdown}>
						<a href="#" onClick={this.showDropdown} id="profilenamelink">{this.state.username}</a>
						<ul style={{display:this.state.dropdownOpen?"block":"none"}} className="dropdown-menu" aria-labelledby="profilenamelink" id="profilemenu">
							<li><a href="#" onClick={this.showSaved}>Saved Entries</a></li>
							<li><a href="#" onClick={this.showAccountInfo}>Account Information</a></li>
							<li><a href="#" onClick={this.handleLogout}>Log Out</a></li>
	                  </ul>
					</div>
					:
					<div></div>
					}
                    <a href="#loginModal" onClick={this.handleLogin} className="btn-login">LOGIN -</a> 
                    <a data-toggle="modal" onClick={this.handleRegister} href="#registerModal" className="btn-register registerbtn">REGISTER</a>
                    <a href="#" className="btn-account" onClick={this.showAccountInfo}>ACCOUNT INFORMATION -</a>
                    <a data-toggle="modal" href="#savedModal" className="btn-saved" onClick={this.showSaved}> MY SEARCHES</a>
                    {/*<a data-toggle="modal" href="#loginModal" className="loginbtn">SAVED</a>
                    <a data-toggle="modal" href="#emailModal" id="emailbtn">EMAIL</a>*/}
                </div>
            </div>
		);
	}
});