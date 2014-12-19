/** @jsx React.DOM */

var React = require('react');

module.exports = React.createClass({
	getDefaultProps: function() {
		return { errors: [] };
	},
	
	errorFor: function(id) {
		return _.find(this.props.errors, {id: id});
	},
	
	showForgot: function() {
		$('#loginModal').modal().find('.modal-content').addClass('forgotpass');
		
		return false;
	},
	
	// just proxy to toolbar's button for the deeplink logic
	registerClick: function() {
		_gaq.push(['_trackEvent', 'UI', 'Show Register Form', 'Login Page']);
		router.navigate('register/' + Backbone.history.getFragment(), {trigger: true});
		return false;
	},
	
	handleKey: function(e) {
		if(e.keyCode == 13)
			this.props.onSubmit();
	},
	

	
	render: function() {
		return (
		
		                <div className="landing-login">
		                    <h1>Log In</h1>
		                    <form id="landing-login-form">
		                    <div className={'em ' + (this.errorFor("email") ? 'has-errors' : '') }>
		                        <input type="email" onKeyDown={this.handleKey} placeholder="Email" name="email" id="email" />
		                        {this.errorFor("email") && <p className="errors" dangerouslySetInnerHTML={{__html:this.errorFor("email").message}}></p>}
		                    </div>
		                    <div className={'pw ' + (this.errorFor("password") ? 'has-errors' : '') }>
		                        <input type="password" onKeyDown={this.handleKey} name="password" id="password" placeholder="Password" />
		                        <a href="#" className="btn-forgot" onClick={this.showForgot}>?</a>
		                        {this.errorFor("password") && <p className="errors">{this.errorFor("password").message}</p>}
		                    </div>
		                    </form>
		                    <a href="#" onClick={this.props.onSubmit} className="btn-submit">SUBMIT</a>
		                    <span>Not a member? <a href="#" onClick={this.registerClick}>Register Here</a></span>
		                </div>
		);
	}
});