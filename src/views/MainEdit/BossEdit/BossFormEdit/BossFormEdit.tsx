import React, { ChangeEvent } from 'react';
import './BossFormEdit.scss';
import { BossFormModel, ProjectModel, SpriteModel } from '../../../../utils/datatypes';
import ObjectHelper from '../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../components/ObjectSelect/ObjectSelect";
import PathHelper from '../../../../utils/PathHelper';
import AnimatedSpriteCanvas from '../../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';

interface Props
{
    project: ProjectModel;
    id: number;
    onUpdate: (project: ProjectModel) => any;
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
        return ObjectHelper.getObjectWithId<SpriteModel>(this.bossForm.spriteId, this.props.project);
    }

    get bossForm(): BossFormModel
    {
        return ObjectHelper.getObjectWithId<BossFormModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<BossFormModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.bossForm,
            ...obj
        }, this.props.project));
    }

    handleSpriteChange = (spriteId: number) =>
    {
        this.update({ spriteId });
    }

    handleScriptChange = (scriptId: number) =>
    {
        this.update({ scriptId });
    }

    handleHpChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.bossForm.hp;
        }
        const hp = Math.max(1, val);
        this.update({ hp });
    }

    handleLifetimeChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.bossForm.lifetime;
        }
        const lifetime = Math.max(1, val);
        this.update({ lifetime });
    }

    handleRequestRemove = () =>
    {
        this.props.onRequestRemove(this.props.id);
    }

    render()
    {
        return (
            <div className="bossFormEdit col">
                <h2>Form {this.props.index.toString()}</h2>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.bossForm.spriteId}
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
                        value={this.bossForm.hp.toString()}
                        onChange={this.handleHpChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Lifetime:</span>
                    <input
                        type="number"
                        value={this.bossForm.lifetime.toString()}
                        onChange={this.handleLifetimeChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.bossForm.scriptId}
                        objectType={"script"}
                        onChange={this.handleScriptChange}
                        project={this.props.project}
                        onRequestEdit={this.props.onRequestEdit}
                    />
                </div>
                <button onClick={this.handleRequestRemove} className="remove">- Remove</button>
            </div>
        );
    }
}
