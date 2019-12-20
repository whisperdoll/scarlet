import React from 'react';
import "./ContextMenu.scss";

interface Props
{
    showing: boolean;
    text: string;
    onClick: () => any;
}

interface State
{
}

export default class ContextMenuItem extends React.PureComponent<Props, State>
{
    handleClick = () =>
    {
        this.props.onClick();
    }

    render()
    {
        return (
            <div
                className="contextMenuItem"
                onClick={this.handleClick}
                style={{
                    display: this.props.showing ? "" : "none"
                }}
            >
                {this.props.text}
            </div>
        );
    }
}