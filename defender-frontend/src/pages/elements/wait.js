import React from 'react'


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
        amount %= 4
        this.setState({amount: amount})
    }

    render() {
        return (
            <span>{this.props.text}{".".repeat(this.state.amount)}</span>
        )
    }
}

export default Wait;