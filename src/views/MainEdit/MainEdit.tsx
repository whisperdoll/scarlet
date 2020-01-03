import React from 'react';
import './MainEdit.scss';
import ObjectList from './ObjectList/ObjectList';
import { ObjectModel, ProjectModel, ObjectType, SpriteModel, PlayerModel, ScriptModel, EnemyModel, BulletModel, BossModel, StageModel, BackgroundModel } from '../../utils/datatypes';
import ObjectHelper from '../../utils/ObjectHelper';
import SpriteEdit from './SpriteEdit/SpriteEdit';
import PlayerEdit from './PlayerEdit/PlayerEdit';
import ScriptEdit from './ScriptEdit/ScriptEdit';
import EnemyEdit from './EnemyEdit/EnemyEdit';
import BulletEdit from './BulletEdit/BulletEdit';
import BossEdit from './BossEdit/BossEdit';
import StageEdit from './StageEdit/StageEdit';
import BackgroundEdit from './BackgroundEdit/BackgroundEdit';
import KeyBindEdit from './KeyBindEdit/KeyBindEdit';
import ObjectEdit from '../../components/ObjectEdit/ObjectEdit';

interface Props
{
    project: ProjectModel;
    projectFilename: string;
    onUpdate: (project: ProjectModel) => any;
}

interface State
{
    currentlyEditing: number | null | "keyBinds";
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
        const { obj, project } = ObjectHelper.createAndAddObject(type, this.props.project);

        this.setState(state => ({
            ...state,
            currentlyEditing: obj.id
        }));

        this.props.onUpdate(project);
    }

    handleObjectSelect = (id: number) =>
    {
        this.setState(state => ({
            ...state,
            currentlyEditing: id
        }));
    }

    handleEditKeyBinds = () =>
    {
        this.setState(state => ({
            ...state,
            currentlyEditing: "keyBinds"
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
            return ObjectHelper.getObjectWithId(this.state.currentlyEditing, this.props.project);
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
                        <div className="errorBadge" title={ObjectHelper.errors.join("\n")}>⚠️</div>
                    )}
                    <div className="header">{this.props.project.name}</div>
                    <button onClick={this.handleEditKeyBinds}>Edit Key Bindings</button>
                </div>
                <ObjectList
                    project={this.props.project}
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
                                case "keyBinds":
                                    return (
                                        <KeyBindEdit
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                            }

                            return null;
                        })()}
                    </div>
                )}
                {typeof(this.state.currentlyEditing) === "number" && this.currentlyEditingObj && (
                    <ObjectEdit
                        id={this.state.currentlyEditing}
                        onUpdate={this.props.onUpdate}
                        project={this.props.project}
                        onRequestEdit={this.handleRequestEdit}
                    />
                )}
            </div>
        );
    }
}
