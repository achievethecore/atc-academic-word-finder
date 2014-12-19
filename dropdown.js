/** @jsx React.DOM */

var React = require('react');
var shallowEqual = require('react/lib/shallowEqual');

module.exports = React.createClass({

	getInitialState: function() {
		return { dropdownOpen: false }
	},
	
	getDefaultProps: function() {
		return {hideCurrent: false}
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
	
	handleSelect: function(val, event) {
		this.setState({ dropdownOpen: false });
		this.props.onChange(val);
		return false;
	},
	
	  shouldComponentUpdate: function(nextProps, nextState) {
	    return !shallowEqual(this.props, nextProps) ||
	           !shallowEqual(this.state, nextState);
	  },
	
	render: function() {
		return (
	    	<div className="sort-widget">
	            <div className={"dropdown "+this.props.className+' '+(this.state.dropdownOpen?'open':'')}>
	                <a href="#" data-toggle="dropdown" onClick={this.toggleDropdown} className="toggle"><data>{_.find(this.props.options, {value:this.props.value}).label}</data><span>&#8217;</span></a>
	                <ul className="dropdown-menu">
	                {
						_.reject(this.props.options,(function(e) { return (e.value == this.props.value && this.props.hideCurrent) }).bind(this)).map((function(e) {
							return <li key={e.value}><a href="#" onClick={this.handleSelect.bind(this, e.value)}>{e.label}</a></li>;
						}).bind(this))
					}
	                </ul>
	            </div>
	    	</div>
		);
	}
});