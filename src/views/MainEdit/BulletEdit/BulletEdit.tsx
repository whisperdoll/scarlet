import React, { ChangeEvent } from 'react';
import './BulletEdit.scss';
import { BulletModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectCache from '../../../utils/objectcache';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import SpriteEdit from '../SpriteEdit/SpriteEdit';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    bullet: BulletModel;
    onUpdate: (bullet: BulletModel) => any;
}

interface State
{
}

export default class BulletEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleSpriteChange = this.handleSpriteChange.bind(this);
        this.handleScriptChange = this.handleScriptChange.bind(this);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectCache.getObjectWithId<SpriteModel>(this.props.bullet.spriteId) || null;
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        this.props.onUpdate({
            ...this.props.bullet,
            name: e.currentTarget.value
        });
    }

    handleSpriteChange(spriteId: number)
    {
        this.props.onUpdate({
            ...this.props.bullet,
            spriteId: spriteId
        });
    }

    handleScriptChange(scriptId: number)
    {
        this.props.onUpdate({
            ...this.props.bullet,
            scriptId: scriptId
        });
    }

    render()
    {
        return (
            <div className="bulletEdit">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.bullet.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.props.bullet.spriteId}
                        objectType={"sprite"}
                        project={this.props.project}
                        onChange={this.handleSpriteChange}
                    />
                    {this.sprite && <img className="sprite" src={this.sprite.path} />}
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.props.bullet.scriptId}
                        objectType={"script"}
                        onChange={this.handleScriptChange}
                        project={this.props.project}
                    />
                </div>
            </div>
        );
    }
}
