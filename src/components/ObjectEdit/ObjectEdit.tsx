import React from 'react';
import ObjectList from '../../views/MainEdit/ObjectList/ObjectList';
import { ObjectModel, ProjectModel, ObjectType, SpriteModel, PlayerModel, ScriptModel, EnemyModel, BulletModel, BossModel, StageModel, BackgroundModel } from '../../utils/datatypes';
import ObjectHelper from '../../utils/ObjectHelper';
import SpriteEdit from '../../views/MainEdit/SpriteEdit/SpriteEdit';
import PlayerEdit from '../../views/MainEdit/PlayerEdit/PlayerEdit';
import ScriptEdit from '../../views/MainEdit/ScriptEdit/ScriptEdit';
import EnemyEdit from '../../views/MainEdit/EnemyEdit/EnemyEdit';
import BulletEdit from '../../views/MainEdit/BulletEdit/BulletEdit';
import BossEdit from '../../views/MainEdit/BossEdit/BossEdit';
import StageEdit from '../../views/MainEdit/StageEdit/StageEdit';
import BackgroundEdit from '../../views/MainEdit/BackgroundEdit/BackgroundEdit';
import KeyBindEdit from '../../views/MainEdit/KeyBindEdit/KeyBindEdit';

interface Props
{
    id: number;
    project: ProjectModel;
    onUpdate: (project: ProjectModel) => any;
    onRequestEdit: (id: number) => any;
}

interface State
{
}

export default class ObjectEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    get currentlyEditingObj(): ObjectModel | null
    {
        if (typeof(this.props.id) === "number")
        {
            return ObjectHelper.getObjectWithId(this.props.id, this.props.project);
        }
        else
        {
            return null;
        }
    }

    render()
    {
        // ADDTYPE
        const obj = ObjectHelper.getObjectWithId(this.props.id, this.props.project);

        const editPart = obj ? (() => {
            switch (obj.type)
            {
                case "sprite":
                    return (
                        <SpriteEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                        />
                    );
                case "player":
                    return (
                        <PlayerEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                            onRequestEdit={this.props.onRequestEdit}
                        />
                    );
                case "script":
                    return (
                        <ScriptEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                        />
                    );
                case "enemy":
                    return (
                        <EnemyEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                            onRequestEdit={this.props.onRequestEdit}
                        />
                    );
                case "bullet":
                    return (
                        <BulletEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                            onRequestEdit={this.props.onRequestEdit}
                        />
                    );
                case "boss":
                    return (
                        <BossEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                            onRequestEdit={this.props.onRequestEdit}
                        />
                    );
                case "stage":
                    return (
                        <StageEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                        />
                    );
                case "background":
                    return (
                        <BackgroundEdit
                            id={this.props.id}
                            onUpdate={this.props.onUpdate}
                            project={this.props.project}
                        />
                    )
            }
        })() : null;

        return (
            <div className="objectEdit">
                <h1 className="noEmpty">{obj?.name}</h1>
                {editPart}
            </div>
        );
    }
}
