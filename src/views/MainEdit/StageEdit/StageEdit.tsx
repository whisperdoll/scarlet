import React, { ChangeEvent } from 'react';
import './StageEdit.scss';
import { StageModel, ProjectModel } from '../../../utils/datatypes';
import StageComposer from './StageComposer/StageComposer';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    onUpdate: (stage: StageModel) => any;
    onProjectUpdate: (project: ProjectModel) => any;
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

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleEditRequest = this.handleEditRequest.bind(this);
        this.handleStageComposerBack = this.handleStageComposerBack.bind(this);
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        this.props.onUpdate({
            ...this.props.stage,
            name: e.currentTarget.value
        });
    }

    handleEditRequest()
    {
        this.setState((state) =>
        {
            return {
                ...state,
                showingComposer: true
            };
        });
    }

    handleStageComposerBack()
    {
        this.setState((state) =>
        {
            return {
                ...state,
                showingComposer: false
            };
        });
    }

    render()
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
                            value={this.props.stage.name}
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
                    onUpdate={this.props.onUpdate}
                    project={this.props.project}
                    stage={this.props.stage}
                    onProjectUpdate={this.props.onProjectUpdate}
                />
            )
        }
    }
}
