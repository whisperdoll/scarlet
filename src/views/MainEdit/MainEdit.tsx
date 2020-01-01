import React from 'react';
import './MainEdit.scss';
import ObjectList from './ObjectList/ObjectList';
import { ObjectModel, ProjectModel, ObjectType, SpriteModel, ErrorTypes, PlayerModel, ScriptModel, EnemyModel, BulletModel, BossModel, StageModel, BackgroundModel } from '../../utils/datatypes';
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

interface Props
{
    project: ProjectModel;
    projectFilename: string;
    onUpdate: (project: ProjectModel) => any;
}

interface State
{
    currentlyEditing: number | null | "keyBinds";
    errors: ErrorTypes[];
}

export default class MainEditView extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            currentlyEditing: null,
            errors: []
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

    handleProjectUpdate = (project: ProjectModel) =>
    {
        this.props.onUpdate(project);
    }

    handleEditKeyBinds = () =>
    {
        this.setState(state => ({
            ...state,
            currentlyEditing: "keyBinds"
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
                    <div className="header">{this.props.project.name}</div>
                    <button onClick={this.handleEditKeyBinds}>Edit Key Bindings</button>
                </div>
                <div className="error">{this.state.errors.join(", ")}</div>
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
                                            onUpdate={this.handleProjectUpdate}
                                            project={this.props.project}
                                        />
                                    );
                            }

                            return null;
                        })()}
                    </div>
                )}
                {typeof(this.state.currentlyEditing) === "number" && this.currentlyEditingObj && (
                    <div className="objectEdit">
                        <h1 className="noEmpty">{this.currentlyEditingObj.name}</h1>
                        {(() => {
                            switch (this.currentlyEditingObj.type)
                            {
                                case "sprite":
                                    return (
                                        <SpriteEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                                case "player":
                                    return (
                                        <PlayerEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                                case "script":
                                    return (
                                        <ScriptEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                                case "enemy":
                                    return (
                                        <EnemyEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                                case "bullet":
                                    return (
                                        <BulletEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                                case "boss":
                                    return (
                                        <BossEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                                case "stage":
                                    return (
                                        <StageEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    );
                                case "background":
                                    return (
                                        <BackgroundEdit
                                            id={this.state.currentlyEditing}
                                            onUpdate={this.props.onUpdate}
                                            project={this.props.project}
                                        />
                                    )
                            }
                        })()}
                    </div>
                )}
            </div>
        );
    }
}
