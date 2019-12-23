import React, { ChangeEvent } from 'react';
import './PlayerEdit.scss';
import { PlayerModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import PathHelper from '../../../utils/PathHelper';

interface Props
{
    project: ProjectModel;
    player: PlayerModel;
    onUpdate: (player: PlayerModel) => any;
}

interface State
{
}

export default class PlayerEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.player.spriteId, this.props.project) || null;
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.onUpdate({
            ...this.props.player,
            name: e.currentTarget.value
        });
    }

    handleMoveSpeedChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.player.moveSpeed;
        }

        this.props.onUpdate({
            ...this.props.player,
            moveSpeed: val
        });
    }

    handleFocusedMoveSpeedChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.player.focusedMoveSpeed;
        }

        this.props.onUpdate({
            ...this.props.player,
            focusedMoveSpeed: val
        });
    }

    handleSpriteChange = (spriteId: number) =>
    {
        this.props.onUpdate({
            ...this.props.player,
            spriteId: spriteId
        });
    }

    handleScriptChange = (scriptId: number) =>
    {
        this.props.onUpdate({
            ...this.props.player,
            scriptId: scriptId
        });
    }

    handleBulletChange = (bulletId: number) =>
    {
        this.props.onUpdate({
            ...this.props.player,
            bulletId: bulletId
        });
    }

    render = () =>
    {
        return (
            <div className="playerEdit col">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.player.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.props.player.spriteId}
                        objectType={"sprite"}
                        project={this.props.project}
                        onChange={this.handleSpriteChange}
                    />
                    {this.sprite && <img className="sprite" src={PathHelper.resolveObjectFileName(this.sprite.path)} alt="sprite" />}
                </div>
                <div className="row">
                    <span className="label">Move Speed:</span>
                    <input
                        type="number"
                        onChange={this.handleMoveSpeedChange}
                        value={this.props.player.moveSpeed}
                    />
                    <span>pixels per frame</span>
                </div>
                <div className="row">
                    <span className="label">Focused Speed:</span>
                    <input
                        type="number"
                        onChange={this.handleFocusedMoveSpeedChange}
                        value={this.props.player.focusedMoveSpeed}
                    />
                    <span>pixels per frame</span>
                </div>
                <div className="row">
                    <span className="label">Bullet:</span>
                    <ObjectSelect
                        currentObjectId={this.props.player.bulletId}
                        objectType={"bullet"}
                        onChange={this.handleBulletChange}
                        project={this.props.project}
                    />
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.props.player.scriptId}
                        objectType={"script"}
                        onChange={this.handleScriptChange}
                        project={this.props.project}
                    />
                </div>
            </div>
        );
    }
}
