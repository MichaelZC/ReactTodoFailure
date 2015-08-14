require("es5-shim")
require("babel/polyfill")
let fetch = require('./fetcher')
import Backbone from 'backbone'
import $ from 'jquery'
import React from 'react'
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar'
import _ from 'underscore'
var Bootstrap = require('react-bootstrap')


Parse.initialize("R0Y7jHbvHQPegrFzzcAjK5iETC2JDQmVczcnepJF", "ZIfa2IFOashuVWiKoxHbRkI4LH4JAIFv8MTPYAlM");

var Task = Parse.Object.extend({
	className: 'Task',
	defaults: {
		title: null,
		description: null,
		status: 'not started',
		owner: 'none',
		steps: []
	}
})
var Tasks = new Parse.Query(Task)
var pullTasks = () => Tasks.find({
	success: function(results) {
		console.log('new list')
		React.render(<ToDo tasks={results} />, document.querySelector('.container'))
	},
	error: function(error) {
		console.log(error)
	}
})

const states = ['not started', 'in progress', 'completed']
const buttonStyles = {
	'in progress': 'warning',
	'completed': 'success',
	'not started': 'default'
}
const tabStyle = {
	'in progress': 'warning',
	'completed': 'success',
	'not started': 'danger'
}

class Decompose extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			name: this.props.step.name,
			status: this.props.step.status
		}
	}
	_restyle() {
		var current = states.indexOf(this.state.status),
			next = (current+1)
		this.setState({
			status: states[next%3]
		})
	}
	_getColor() {
		return tabStyle[this.state.status]
	}
	render() {
		var status = this.state.status,
			color = this._getColor()
		return(<Bootstrap.ListGroupItem bsStyle={color} onClick={()=> this._restyle()}>
				{this.props.step.name}
			</Bootstrap.ListGroupItem>)
		}
}

class TaskView extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			title: this.props.task.get('title'),
			description: this.props.task.get('description'),
			status: this.props.task.get('status'),
			owner: this.props.task.get('owner'),
			editable: false
		}
		this._setModel = _.debounce(() => {
			this.props.task.set(this.state)
			this.props.task.save()
		}, 1500)
	}
	_changeStatus() {
		var current = states.indexOf(this.state.status),
			next = (current+1)
		this.setState({
			status: states[next%3]
		})
		this._setModel()
	}
	_editable() {
		this.setState({
			editable: !this.state.editable
		})
	}
	_handleChange(e) {
		this.setState({
			title: e.target.value
		})
	}
	_closeInput(e) {
		if (e.key === 'Enter') {
			if (this.state.title === '') {
			this.setState({title: this.props.task.get('title')})
			return
			} 
			this._editable()
			this._setModel()
		}
	}
	_destroy() {
		var input = confirm('Would you like to delete this task?')
		if (input === true) {
			this.props.parent._removeTask(this.props.task)
		}
	}
	_detail() {
		this.props.parent.setState({
			currentTask: this.props.task
		})
	}
	render() {
		var buttonStyle = buttonStyles[this.state.status],
			title = this.state.editable ? <input onKeyPress={(e) => this._closeInput(e)} onChange={(e) => this._handleChange(e)} value={this.state.title}></input> : <div style={{height: '1rem', minWidth: '5'}} onDoubleClick={() => this._editable()} ref='title' className='title'>{this.state.title}</div> 
		return (<Bootstrap.ListGroupItem onClick={() => this._detail()} style={{maxWidth: '500px', position: 'relative', textAlign: 'center'}} header={
			<Bootstrap.Button bsStyle={buttonStyle} style={{width: '50%', margin: 'auto'}} onClick={() => this._changeStatus()} block>{this.state.status}</Bootstrap.Button>}>
			{title}
			<div onClick={() => this._destroy()} className='delete'>X</div>
			</Bootstrap.ListGroupItem>)		
	}
}


class ToDo extends React.Component {	
	constructor(props) {
		super(props)
		this.state = {
			currentTask: null
		}
		this.state.tasks = this.props.tasks
	}
	_newTask() {
		name = prompt('name this task')
		if (name === 'null' || name.length < 1) {
			console.log('caught')
			return
		} else {
			var newTask = new Task
			newTask.set({
				title: name,
				steps: []
			})
			this.state.tasks.push(newTask)
			this.forceUpdate()
			newTask.save()
			console.log(newTask)
		}
	}
	_removeTask(task) {
		var newArr = _.without(this.state.tasks, task),
			nextTask = (this.state.currentTask === task) ? null : this.state.currentTask
		task.destroy()
		this.setState({
			tasks: newArr,
			currentTask: nextTask
		})
	}
	_addStep() {
		console.log(this.state.currentTask)
		name = prompt(`What's step number ${this.state.currentTask.get('steps').length+1}?`)
		if (name === 'null' || name.length < 1) {
			return
		} else {
			this.state.currentTask.attributes.steps.push({
				name: name,
				status: 'not started'
			})
			this.forceUpdate()
		}
		this.state.currentTask.save()
	}
	render() {
		var addStep = this.state.currentTask ? <Bootstrap.Button bsStyle='primary' onClick={() => this._addStep()}>Add A Step</Bootstrap.Button> : <span/>,
			steps = this.state.currentTask ? (this.state.currentTask.get('steps').map((step) => <Decompose task={this.state.currentTask} step={step}/>)) : <span/>
		return(<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
			<Bootstrap.ListGroup style={{flexGrow: '1', marginTop: '1rem'}} >
			{this.state.tasks.map((task) => <TaskView parent={this} task={task} /> )}
			<Bootstrap.Button onClick={() => this._newTask()}>New Task</Bootstrap.Button>
			</Bootstrap.ListGroup>
			<Bootstrap.ListGroup style={{flexGrow: '1', marginTop: '1rem'}}>
			{steps}
			{addStep}
			</Bootstrap.ListGroup>
			</div>)
	}
}
pullTasks()