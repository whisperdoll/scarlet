import React, { ChangeEvent } from 'react';
import './StageEdit.scss';
import { StageModel, ProjectModel } from '../../../utils/datatypes';
import StageComposer from './StageComposer/StageComposer';
import ObjectHelper from '../../../utils/ObjectHelper';

interface Props
{
    id: number;
    project: ProjectModel;
    onUpdate: (project: ProjectModel) => any;
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

    get stage(): StageModel
    {
        return ObjectHelper.getObjectWithId<StageModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<StageModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.stage,
            ...obj
        }, this.props.project));
    }


    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.update({
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
                            value={this.stage.name}
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
                    id={this.props.id}
                />
            )
        }
    }
}
