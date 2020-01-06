import React, { ChangeEvent } from 'react';
import './BossFormEdit.scss';
import { BossFormModel, ProjectModel, SpriteModel } from '../../../../utils/datatypes';
import ObjectHelper from '../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../components/ObjectSelect/ObjectSelect";
import PathHelper from '../../../../utils/PathHelper';
import AnimatedSpriteCanvas from '../../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';

interface Props
{
    obj: BossFormModel;
    update: (obj: Partial<BossFormModel>) => any;
    index: number;
    onRequestRemove: (id: number) => any;
    onRequestEdit: (id: number) => any;
}

interface State
{
}

export default class BossFormEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.obj.spriteId);
    }

    handleSpriteChange = (spriteId: number) =>
    {
        this.props.update({ spriteId });
    }

    handleScriptChange = (scriptId: number) =>
    {
        this.props.update({ scriptId });
    }

    handleHpChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.obj.hp;
        }
        const hp = Math.max(1, val);
        this.props.update({ hp });
    }

    handleLifetimeChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.obj.lifetime;
        }
        const lifetime = Math.max(1, val);
        this.props.update({ lifetime });
    }

    handleRequestRemove = () =>
    {
        this.props.onRequestRemove(this.props.obj.id);
    }

    render()
    {
        return (
            <div className="bossFormEdit col">
                <h2>Form {this.props.index.toString()}</h2>
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
                    <span className="label">HP:</span>
                    <input
                        type="number"
                        value={this.props.obj.hp.toString()}
                        onChange={this.handleHpChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Lifetime:</span>
                    <input
                        type="number"
                        value={this.props.obj.lifetime.toString()}
                        onChange={this.handleLifetimeChange}
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
                <button onClick={this.handleRequestRemove} className="remove">- Remove</button>
            </div>
        );
    }
}
