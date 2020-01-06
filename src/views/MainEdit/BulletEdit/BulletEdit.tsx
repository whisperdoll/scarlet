import React, { ChangeEvent } from 'react';
import './BulletEdit.scss';
import { BulletModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import PathHelper from '../../../utils/PathHelper';
import AnimatedSpriteCanvas from '../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';

interface Props
{
    obj: BulletModel;
    update: (obj: Partial<BulletModel>) => any;
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
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.obj.spriteId) || null;
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.update({
            name: e.currentTarget.value
        });
    }

    handleSpriteChange = (spriteId: number) =>
    {
        this.props.update({
            spriteId: spriteId
        });
    }

    handleScriptChange = (scriptId: number) =>
    {
        this.props.update({
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

        this.props.update({
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
                        value={this.props.obj.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.props.obj.spriteId}
                        objectType={"sprite"}
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
                        value={this.props.obj.damage}
                        onChange={this.handleDamageChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.props.obj.scriptId}
                        objectType={"script"}
                        onChange={this.handleScriptChange}
                        onRequestEdit={this.props.onRequestEdit}
                    />
                </div>
            </div>
        );
    }
}
