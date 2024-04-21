import React from 'react'

const max_amount = 3;

class Wait extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            amount: 0
        }
    }

    componentDidMount() {
        setInterval(this.tick.bind(this), 400)
    }

    tick() {
        let amount = this.state.amount + 1
        amount %= (max_amount + 1)
        this.setState({amount: amount})
    }

    render() {
        return (
            <span>{this.props.text}{".".repeat(this.state.amount)}<span className='invisible'>{".".repeat(max_amount - this.state.amount)}</span></span>
        )
    }
}

export default Wait;