/** @jsx React.DOM */

var React = require('react');
var shallowEqual = require('react/lib/shallowEqual');

module.exports = React.createClass({
	  shouldComponentUpdate: function(nextProps, nextState) {
	    return !shallowEqual(this.props, nextProps) ||
	           !shallowEqual(this.state, nextState);
	  },
	  
	getInitialState: function() {
		return { grade:undefined, text:undefined, dropdownOpen: false }
	},
	
	getDefaultProps: function() {
		return { errors: [] };
	},
	errorFor: function(id) {
		return _.find(this.props.errors, {id: id});
	},
	
	
	componentDidMount: function() {
			$('body').on('click', (function(e) {
				if(!this.isMounted()) return;
				if($(e.target).closest('.dropdown').length) return;
				this.setState({ dropdownOpen: false });
			}).bind(this));
	},
	
	toggleDropdown: function() {
		this.setState({ dropdownOpen: !this.state.dropdownOpen });
		
		return false;
	},
	
	chooseGrade: function(event) {
		this.setState({ grade:$(event.target).text(), dropdownOpen: false });
		return false;
	},
	
	setText: function(event) {
		this.setState({ text:$(event.target).val()});
		return false;
	},
	
	
	valid: function() {
		return this.state.grade !== undefined && !!this.state.text;
	},
	
	handleSubmit: function(event) {
		this.props.onSubmit(this.state.grade, this.state.text);
		return false;
	},
	
	render: function() {
		return (
                <div className="landing-info">
                    <h1>Insert your text.</h1>
                    <p>Copy and paste a text of your choice in the box below. There is a 20,000 word limit&mdash;approximately 5 pages.</p>
                    <div>
                    	{this.errorFor("text") && <p className="errors">{this.errorFor("text").message}</p>}
                        <textarea className={this.errorFor("text") && 'has-error'} placeholder="Paste your text here" onChange={this.setText}></textarea>
                    </div>
                    <div className={"dropdown landing-dropdown "+(this.state.dropdownOpen?'open':'')} id="dropdown-grade">
                        <a href="#" data-toggle="dropdown" onClick={this.toggleDropdown} className="toggle"><data>{this.state.grade || 'SELECT A GRADE'}</data><span>&#8217;</span></a>
                        <ul className="dropdown-menu">
                        {
							_.range(0,13).map((function(i) {
								return <li key={i}><a href="#" onClick={this.chooseGrade}>{i===0?'K':i}</a></li>;
							}).bind(this))
						}
                        </ul>
                    </div>
                    <a href="#" onClick={this.handleSubmit} className={'btn-submit ' + (this.valid()?'':'invisible')}><data>SUBMIT</data><span></span></a>
                </div>
		);
	}
});