import React, { ChangeEvent } from 'react';
import './BossFormEdit.scss';
import { BossFormModel, ProjectModel, SpriteModel } from '../../../../utils/datatypes';
import ObjectHelper from '../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../components/ObjectSelect/ObjectSelect";

interface Props
{
    project: ProjectModel;
    bossForm: BossFormModel;
    index: number;
    onUpdate: (bossForm: BossFormModel, index: number) => any;
    onRequestRemove: (index: number) => any;
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
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.bossForm.spriteId, this.props.project) || null;
    }

    handleSpriteChange = (spriteId: number) =>
    {
        this.props.onUpdate({
            ...this.props.bossForm,
            spriteId: spriteId
        }, this.props.index);
    }

    handleScriptChange = (scriptId: number) =>
    {
        this.props.onUpdate({
            ...this.props.bossForm,
            scriptId: scriptId
        }, this.props.index);
    }

    handleBulletChange = (bulletId: number) =>
    {
        this.props.onUpdate({
            ...this.props.bossForm,
            bulletId: bulletId
        }, this.props.index);
    }

    handleHpChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.bossForm.hp;
        }

        this.props.onUpdate({
            ...this.props.bossForm,
            hp: val
        }, this.props.index);
    }

    handleLifetimeChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.bossForm.lifetime;
        }

        this.props.onUpdate({
            ...this.props.bossForm,
            lifetime: val
        }, this.props.index);
    }

    handleRequestRemove = () =>
    {
        this.props.onRequestRemove(this.props.index);
    }

    render()
    {
        return (
            <div className="bossFormEdit col">
                <h2>Form {this.props.index.toString()}</h2>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.props.bossForm.spriteId}
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
                        value={this.props.bossForm.hp.toString()}
                        onChange={this.handleHpChange}
                        min={1}
                    />
                </div>
                <div className="row">
                    <span className="label">Lifetime:</span>
                    <input
                        type="number"
                        value={this.props.bossForm.lifetime.toString()}
                        onChange={this.handleLifetimeChange}
                        min={1}
                    />
                </div>
                <div className="row">
                    <span className="label">Bullet:</span>
                    <ObjectSelect
                        currentObjectId={this.props.bossForm.bulletId}
                        objectType={"bullet"}
                        onChange={this.handleBulletChange}
                        project={this.props.project}
                    />
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.props.bossForm.scriptId}
                        objectType={"script"}
                        onChange={this.handleScriptChange}
                        project={this.props.project}
                    />
                </div>
                <button onClick={this.handleRequestRemove} className="remove">- Remove</button>
            </div>
        );
    }
}
