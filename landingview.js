/** @jsx React.DOM */

var React = require('react');
var Toolbar = require('./toolbar');
var EntryForm = require('./entryform');
var LoginView = require('./loginview');

module.exports = React.createClass({
	componentDidMount: function() {
		var rsz = function() {
			$('.atf').height( $(window).height() );
			$('.btf').css('top', $(window).height() );
		}
		$(window).resize(rsz);
		rsz();
		$('.bottom').hide(); $('.btf').hide();
		$(this.getDOMNode()).find('.btf').html($('.btf').eq(0).html());
	},
	
	render: function() {
		return (
			<div className="landing">
				<div className="atf">
					<Toolbar />
					<div className="middle">
						 <div className="landing-main">
		                    <h1>Find the high value words in your text.</h1>
		                    <a href="#new" className="landing-btn btn-new"><span></span><data>START A NEW ENTRY</data></a>
		                    <a href="#continue" className="landing-btn btn-continue"><span></span><data>ACCESS A SAVED ENTRY</data></a>
	                	</div>
	                	<EntryForm key={this.props.clearKey} errors={this.props.errors} onSubmit={this.props.onEntrySubmit} />
	                	<LoginView errors={this.props.errors} onSubmit={this.props.onLogin} />


                	</div>
             <div className="bottom">
                Scroll to learn more
                <div>&#8217;</div>
            </div>               	
                	
				</div>
				<div className="btf"/>
			</div>
		);
	}
});