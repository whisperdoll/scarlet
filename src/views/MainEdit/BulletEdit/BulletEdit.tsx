import React, { ChangeEvent } from 'react';
import './BulletEdit.scss';
import { BulletModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import PathHelper from '../../../utils/PathHelper';
import AnimatedSpriteCanvas from '../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';

interface Props
{
    project: ProjectModel;
    id: number;
    onUpdate: (project: ProjectModel) => any;
    onRequestEdit: (id: number) => any;
}

interface State
{
}

export default class BulletEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.bullet.spriteId, this.props.project) || null;
    }

    get bullet(): BulletModel
    {
        return ObjectHelper.getObjectWithId<BulletModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<BulletModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.bullet,
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

    handleDamageChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = 1;
        }

        this.update({
            damage: val
        });
    }

    render = () =>
    {
        return (
            <div className="bulletEdit col">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.bullet.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.bullet.spriteId}
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
                    <span className="label">Damage:</span>
                    <input
                        type="number"
                        value={this.bullet.damage}
                        onChange={this.handleDamageChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.bullet.scriptId}
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
