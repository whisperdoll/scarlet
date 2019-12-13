import React, { ChangeEvent } from 'react';
import './EnemyEdit.scss';
import { EnemyModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectCache from '../../../utils/objectcache';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import SpriteEdit from '../SpriteEdit/SpriteEdit';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    enemy: EnemyModel;
    onUpdate: (enemy: EnemyModel) => any;
}

interface State
{
}

export default class EnemyEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleSpriteChange = this.handleSpriteChange.bind(this);
        this.handleScriptChange = this.handleScriptChange.bind(this);
        this.handleBulletChange = this.handleBulletChange.bind(this);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectCache.getObjectWithId<SpriteModel>(this.props.enemy.spriteId) || null;
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        this.props.onUpdate({
            ...this.props.enemy,
            name: e.currentTarget.value
        });
    }

    handleSpriteChange(spriteId: number)
    {
        this.props.onUpdate({
            ...this.props.enemy,
            spriteId: spriteId
        });
    }

    handleScriptChange(scriptId: number)
    {
        this.props.onUpdate({
            ...this.props.enemy,
            scriptId: scriptId
        });
    }

    handleBulletChange(bulletId: number)
    {
        this.props.onUpdate({
            ...this.props.enemy,
            bulletId: bulletId
        });
    }

    render()
    {
        return (
            <div className="enemyEdit">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.enemy.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.props.enemy.spriteId}
                        objectType={"sprite"}
                        project={this.props.project}
                        onChange={this.handleSpriteChange}
                    />
                    {this.sprite && <img className="sprite" src={this.sprite.path} />}
                </div>
                <div className="row">
                    <span className="label">Bullet:</span>
                    <ObjectSelect
                        currentObjectId={this.props.enemy.bulletId}
                        objectType={"bullet"}
                        onChange={this.handleBulletChange}
                        project={this.props.project}
                    />
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.props.enemy.scriptId}
                        objectType={"script"}
                        onChange={this.handleScriptChange}
                        project={this.props.project}
                    />
                </div>
            </div>
        );
    }
}
