import React from 'react';

interface Props
{
    toggled: boolean;
    onToggle: (toggled: boolean) => any;
}

interface State
{
}

export default class ToggleButton extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleClick = () =>
    {
        this.props.onToggle(!this.props.toggled);
    }

    render()
    {
        return (
            <button
                onClick={this.handleClick}
                className={this.props.toggled ? "toggled" : ""}
            >
                {this.props.children}
            </button>
        );
    }
}
