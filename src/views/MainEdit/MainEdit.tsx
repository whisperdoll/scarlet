import React from 'react';
import './MainEdit.scss';
import ObjectList from './ObjectList/ObjectList';
import { ObjectModel, ObjectType } from '../../utils/datatypes';
import ObjectHelper from '../../utils/ObjectHelper';
import ObjectEdit from '../../components/ObjectEdit/ObjectEdit';
import GameSettingsEdit from './GameSettingsEdit/GameSettingsEdit';

interface Props
{
}

interface State
{
    currentlyEditing: number | null | "gameSettings";
}

export default class MainEditView extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            currentlyEditing: null
        };
    }

    handleObjectCreate = (type: ObjectType) =>
    {
        this.setState(state => ({
            ...state,
            currentlyEditing: ObjectHelper.createAndAddObject(type)
        }));
    }

    handleObjectSelect = (id: number) =>
    {
        this.setState(state => ({
            ...state,
            currentlyEditing: id
        }));
    }

    handleEditGameSettings = () =>
    {
        this.setState(state => ({
            ...state,
            currentlyEditing: "gameSettings"
        }));
    }

    handleRequestEdit = (id: number) =>
    {
        this.setState(state => ({
            ...state,
            currentlyEditing: id
        }));
    }

    get currentlyEditingObj(): ObjectModel | null
    {
        if (typeof(this.state.currentlyEditing) === "number")
        {
            return ObjectHelper.getObjectWithId(this.state.currentlyEditing);
        }
        else
        {
            return null;
        }
    }

    render()
    {
        // ADDTYPE
        return (
            <div className="mainEditView">
                <div className="headerBar">
                    {ObjectHelper.errors.length > 0 && (
                        <span role="img" aria-label="Errors" className="errorBadge" title={ObjectHelper.errors.join("\n")}>⚠️</span>
                    )}
                    <div className="header">{ObjectHelper.project!.name}</div>
                    <button onClick={this.handleEditGameSettings}>Edit Game Settings</button>
                </div>
                <ObjectList
                    onCreate={this.handleObjectCreate}
                    onSelect={this.handleObjectSelect}
                />
                {this.state.currentlyEditing !== null && typeof(this.state.currentlyEditing) === "string" && (
                    <div className="objectEdit">
                        <h1 className="noEmpty">{this.state.currentlyEditing}</h1>
                        {(() =>
                        {
                            switch (this.state.currentlyEditing)
                            {
                                case "gameSettings": return <GameSettingsEdit />;
                                default: return null;
                            }
                        })()}
                    </div>
                )}
                {typeof(this.state.currentlyEditing) === "number" && this.currentlyEditingObj && (
                    <ObjectEdit
                        id={this.state.currentlyEditing}
                        onRequestEdit={this.handleRequestEdit}
                    />
                )}
            </div>
        );
    }
}
