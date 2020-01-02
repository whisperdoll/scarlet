import React, { ChangeEvent } from 'react';
import './EnemyEdit.scss';
import { EnemyModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import PathHelper from '../../../utils/PathHelper';
import AnimatedSpriteCanvas from '../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';

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

export default class EnemyEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.enemy.spriteId, this.props.project);
    }

    get enemy(): EnemyModel
    {
        return ObjectHelper.getObjectWithId<EnemyModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<EnemyModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.enemy,
            ...obj
        }, this.props.project));
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.update({
            name: e.currentTarget.value
        });
    }

    handleSpriteChange = (spriteId: number) =>
    {
        this.update({
            spriteId: spriteId
        });
    }

    handleScriptChange = (scriptId: number) =>
    {
        this.update({
            scriptId: scriptId
        });
    }

    handleHpChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy.hp;
        }

        this.update({
            hp: Math.max(1, val)
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
                        value={this.enemy.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.enemy.spriteId}
                        objectType={"sprite"}
                        project={this.props.project}
                        onChange={this.handleSpriteChange}
                        onRequestEdit={this.props.onRequestEdit}
                    />
                    {this.sprite && (
                        <AnimatedSpriteCanvas
                            canvasOptions={{
                                opaque: false,
                                pixelated: true
                            }}
                            sprite={this.sprite}
                            className="sprite"
                        />
                    )}
                </div>
                <div className="row">
                    <span className="label">HP:</span>
                    <input
                        type="number"
                        value={this.enemy.hp.toString()}
                        onChange={this.handleHpChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.enemy.scriptId}
                        objectType={"script"}
                        onChange={this.handleScriptChange}
                        project={this.props.project}
                        onRequestEdit={this.props.onRequestEdit}
                    />
                </div>
            </div>
        );
    }
}
