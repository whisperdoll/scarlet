import React, { ChangeEvent } from 'react';
import './EnemyEdit.scss';
import { EnemyModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";

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
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.enemy.spriteId, this.props.project) || null;
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.onUpdate({
            ...this.props.enemy,
            name: e.currentTarget.value
        });
    }

    handleSpriteChange = (spriteId: number) =>
    {
        this.props.onUpdate({
            ...this.props.enemy,
            spriteId: spriteId
        });
    }

    handleScriptChange = (scriptId: number) =>
    {
        this.props.onUpdate({
            ...this.props.enemy,
            scriptId: scriptId
        });
    }

    handleBulletChange = (bulletId: number) =>
    {
        this.props.onUpdate({
            ...this.props.enemy,
            bulletId: bulletId
        });
    }

    handleHpChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = 5;
        }

        this.props.onUpdate({
            ...this.props.enemy,
            hp: val
        });
    }

    render = () =>
    {
        return (
            <div className="enemyEdit col">
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
                    {this.sprite && <img className="sprite" src={this.sprite.path} alt="sprite" />}
                </div>
                <div className="row">
                    <span className="label">HP:</span>
                    <input
                        type="number"
                        value={this.props.enemy.hp.toString()}
                        onChange={this.handleHpChange}
                        min={1}
                    />
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
