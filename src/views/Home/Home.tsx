import React from 'react';
import './Home.scss';

interface Props
{
    onOpen: () => any;
    onNew: () => any;
}

interface State
{
}

export default class HomeView extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleNew = () =>
    {
        this.props.onNew();
    }
    
    handleOpen = () =>
    {
        this.props.onOpen();
    }

    render = () =>
    {
        return (
            <div id="homeView">
                <h1>scarlet</h1>
                <button onClick={this.handleNew}>New Project</button>
                <button onClick={this.handleOpen}>Open Project</button>
            </div>
        );
    }
}
