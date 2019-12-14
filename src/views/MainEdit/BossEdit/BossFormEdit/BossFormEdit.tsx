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
}

interface State
{
}

export default class BossFormEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.handleSpriteChange = this.handleSpriteChange.bind(this);
        this.handleScriptChange = this.handleScriptChange.bind(this);
        this.handleBulletChange = this.handleBulletChange.bind(this);
        this.handleHpChange = this.handleHpChange.bind(this);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.bossForm.spriteId, this.props.project) || null;
    }

    handleSpriteChange(spriteId: number)
    {
        this.props.onUpdate({
            ...this.props.bossForm,
            spriteId: spriteId
        }, this.props.index);
    }

    handleScriptChange(scriptId: number)
    {
        this.props.onUpdate({
            ...this.props.bossForm,
            scriptId: scriptId
        }, this.props.index);
    }

    handleBulletChange(bulletId: number)
    {
        this.props.onUpdate({
            ...this.props.bossForm,
            bulletId: bulletId
        }, this.props.index);
    }

    handleHpChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = 5;
        }

        this.props.onUpdate({
            ...this.props.bossForm,
            hp: val
        }, this.props.index);
    }

    render()
    {
        return (
            <div className="bossFormEdit">
                <span>Form {this.props.index.toString()}</span>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.props.bossForm.spriteId}
                        objectType={"sprite"}
                        project={this.props.project}
                        onChange={this.handleSpriteChange}
                    />
                    {this.sprite && <img className="sprite" src={this.sprite.path} />}
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
            </div>
        );
    }
}
