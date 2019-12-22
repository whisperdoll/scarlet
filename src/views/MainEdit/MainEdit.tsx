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
    onUpdate: (project: ProjectModel) => any;
}

interface State
{
    currentlyEditing: ObjectModel | null | "keyBinds";
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

        this.setState((state) =>
        {
            return {
                ...state,
                currentlyEditing: obj
            };
        });

        this.props.onUpdate(project);
    }

    handleObjectUpdate = (obj: ObjectModel) =>
    {
        const { errors, project } = ObjectHelper.updateObject(obj, this.props.project, this.state.errors);

        this.props.onUpdate(project);
        this.setState((state) =>
        {
            return {
                ...state,
                currentlyEditing: obj,
                errors: errors
            };
        });
    }

    handleObjectSelect = (obj: ObjectModel) =>
    {
        this.setState((state) =>
        {
            return {
                ...state,
                currentlyEditing: obj
            };
        });
    }

    handleProjectUpdate = (project: ProjectModel) =>
    {
        this.props.onUpdate(project);
    }

    handleEditKeyBinds = () =>
    {
        this.setState((state) =>
        {
            return {
                ...state,
                currentlyEditing: "keyBinds"
            };
        });
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
                {this.state.currentlyEditing && typeof(this.state.currentlyEditing) === "string" && (
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
                {this.state.currentlyEditing && typeof(this.state.currentlyEditing) !== "string" && (
                    <div className="objectEdit">
                        <h1 className="noEmpty">{this.state.currentlyEditing.name}</h1>
                        {(() => {
                            switch (this.state.currentlyEditing.type)
                            {
                                case "sprite":
                                    return (
                                        <SpriteEdit
                                            onUpdate={this.handleObjectUpdate}
                                            sprite={this.state.currentlyEditing as SpriteModel}
                                        />
                                    );
                                case "player":
                                    return (
                                        <PlayerEdit
                                            onUpdate={this.handleObjectUpdate}
                                            player={this.state.currentlyEditing as PlayerModel}
                                            project={this.props.project}
                                        />
                                    );
                                case "script":
                                    return (
                                        <ScriptEdit
                                            onUpdate={this.handleObjectUpdate}
                                            script={this.state.currentlyEditing as ScriptModel}
                                        />
                                    );
                                case "enemy":
                                    return (
                                        <EnemyEdit
                                            onUpdate={this.handleObjectUpdate}
                                            enemy={this.state.currentlyEditing as EnemyModel}
                                            project={this.props.project}
                                        />
                                    );
                                case "bullet":
                                    return (
                                        <BulletEdit
                                            onUpdate={this.handleObjectUpdate}
                                            bullet={this.state.currentlyEditing as BulletModel}
                                            project={this.props.project}
                                        />
                                    );
                                case "boss":
                                    return (
                                        <BossEdit
                                            onUpdate={this.handleObjectUpdate}
                                            boss={this.state.currentlyEditing as BossModel}
                                            project={this.props.project}
                                        />
                                    );
                                case "stage":
                                    return (
                                        <StageEdit
                                            onUpdate={this.handleObjectUpdate}
                                            stage={this.state.currentlyEditing as StageModel}
                                            project={this.props.project}
                                            onProjectUpdate={this.handleProjectUpdate}
                                        />
                                    );
                                case "background":
                                    return (
                                        <BackgroundEdit
                                            onUpdate={this.handleObjectUpdate}
                                            background={this.state.currentlyEditing as BackgroundModel}
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
