import React, { ChangeEvent } from 'react';
import './StageEdit.scss';
import { StageModel } from '../../../utils/datatypes';
import StageComposer from './StageComposer/StageComposer';

interface Props
{
    obj: StageModel;
    update: (obj: Partial<StageModel>) => any;
}

interface State
{
    showingComposer: boolean;
}

export default class StageEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            showingComposer: false
        };
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.update({
            name: e.currentTarget.value
        });
    }

    handleEditRequest = () =>
    {
        this.setState(state => ({
            ...state,
            showingComposer: true
        }));
    }

    handleStageComposerBack = () =>
    {
        this.setState(state => ({
            ...state,
            showingComposer: false
        }));
    }

    render = () =>
    {
        if (!this.state.showingComposer)
        {
            return (
                <div className="stageEdit col">
                    <div className="row">
                        <span className="label">Name:</span>
                        <input
                            type="text"
                            onChange={this.handleNameChange}
                            value={this.props.obj.name}
                        />
                    </div>
                    <button onClick={this.handleEditRequest}>Edit in Stage Composer</button>
                </div>
            );
        }
        else
        {
            return (
                <StageComposer
                    onBack={this.handleStageComposerBack}
                    obj={this.props.obj}
                    update={this.props.update}
                />
            )
        }
    }
}
