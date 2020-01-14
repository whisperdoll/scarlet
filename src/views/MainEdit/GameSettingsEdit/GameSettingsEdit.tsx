import React from 'react';
import './GameSettingsEdit.scss';
import { KeyBindings, ProjectSettings } from '../../../utils/datatypes';
import update from "immutability-helper";
import ObjectHelper from '../../../utils/ObjectHelper';
import KeyBindEdit from '../KeyBindEdit/KeyBindEdit';
import ObjectSelect from '../../../components/ObjectSelect/ObjectSelect';

interface Props
{
}

interface State
{
    settings: ProjectSettings;
    stageIdToAdd: number;
}

export default class GameSettingsEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            settings: ObjectHelper.project!.settings,
            stageIdToAdd: -1
        };
        
        ObjectHelper.subscribeToSettings(this.handleSettingsUpdated);
    }

    componentDidMount = () =>
    {
    }

    componentWillUnmount = () =>
    {
        ObjectHelper.unsubscribeFromSettings(this.handleSettingsUpdated);
    }

    handleSettingsUpdated = (settings: ProjectSettings) =>
    {
        this.setState(state => ({
            ...state,
            settings
        }));
    }

    handleUpdateKeyBindings = (keyBindings: KeyBindings) =>
    {
        ObjectHelper.updateSettings({
            ...ObjectHelper.project!.settings,
            keyBindings
        });
    }

    handleStageChange = (id: number, identifier?: string | number) =>
    {
        const project = ObjectHelper.project!;
        const index = identifier as number;

        if (index !== -1)
        {
            ObjectHelper.updateSettings({
                ...project.settings,
                stageIdOrder: update(project.settings.stageIdOrder, {
                    [index]: {
                        $set: id
                    }
                })
            });
        }
        else
        {
            this.setState(state => ({
                ...state,
                stageIdToAdd: id
            }));
        }
    }

    handleAddStage = () =>
    {
        if (this.state.stageIdToAdd !== -1)
        {
            ObjectHelper.updateSettings({
                ...ObjectHelper.project!.settings,
                stageIdOrder: update(ObjectHelper.project!.settings.stageIdOrder, {
                    $push: [ this.state.stageIdToAdd ]
                })
            });

            this.setState(state => ({
                ...state,
                stageIdToAdd: -1
            }));
        }
    }

    handleRemoveStage = (e: React.MouseEvent) =>
    {
        const index = parseInt(e.currentTarget.getAttribute("data-index")!);

        ObjectHelper.updateSettings({
            ...ObjectHelper.project!.settings,
            stageIdOrder: update(ObjectHelper.project!.settings.stageIdOrder, {
                $splice: [[ index, 1 ]]
            })
        });
    }

    handleChangeResolution = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const dimStr = e.currentTarget.dataset.dim!.toString();
        const prefix = dimStr[0] === "g" ? "resolution" : "stageResolution";
        const dim = dimStr[1].toUpperCase();
        const key = prefix + dim;

        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = (this.state.settings as any)[key];
        }

        ObjectHelper.updateSettings({
            ...ObjectHelper.project!.settings,
            [key]: val
        });
    }
    
    render = () =>
    {
        return (
            <div className="gameSettingsEdit col">
                <h3>Key Bindings</h3>
                <KeyBindEdit
                    keyBindings={this.state.settings.keyBindings}
                    onUpdate={this.handleUpdateKeyBindings}
                />
                <h3>Resolution</h3>
                <div className="row">
                    <span className="label">Game:</span>
                    <input
                        type="number"
                        value={this.state.settings.resolutionX}
                        onChange={this.handleChangeResolution}
                        data-dim="gx"
                    />
                    <span>x</span>
                    <input
                        type="number"
                        value={this.state.settings.resolutionY}
                        onChange={this.handleChangeResolution}
                        data-dim="gy"
                    />
                </div>
                <div className="row">
                    <span className="label">Stage:</span>
                    <input
                        type="number"
                        value={this.state.settings.stageResolutionX}
                        onChange={this.handleChangeResolution}
                        data-dim="sx"
                    />
                    <span>x</span>
                    <input
                        type="number"
                        value={this.state.settings.stageResolutionY}
                        onChange={this.handleChangeResolution}
                        data-dim="sy"
                    />
                </div>
                <h3>Stage Order</h3>
                <div className="col">
                    {ObjectHelper.project?.settings.stageIdOrder.map((id, i) =>
                    (
                        <div className="row" key={i}>
                            <ObjectSelect
                                currentObjectId={id}
                                objectType="stage"
                                onChange={this.handleStageChange}
                                identifier={i}
                            />
                            <button
                                data-index={i}
                                onClick={this.handleRemoveStage}
                                className="remove"
                            >
                                - Remove
                            </button>
                        </div>
                    ))}
                    <div className="row">
                        <ObjectSelect
                            currentObjectId={this.state.stageIdToAdd}
                            objectType="stage"
                            onChange={this.handleStageChange}
                            identifier={-1}
                        />
                        <button onClick={this.handleAddStage}>+ Add</button>
                    </div>
                </div>
            </div>
        );
    }
}
