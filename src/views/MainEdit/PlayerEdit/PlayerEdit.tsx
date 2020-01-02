import React, { ChangeEvent } from 'react';
import './PlayerEdit.scss';
import { PlayerModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import PathHelper from '../../../utils/PathHelper';
import AnimatedSpriteCanvas from "../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas";

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

export default class PlayerEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.player.spriteId, this.props.project);
    }

    get player(): PlayerModel
    {
        return ObjectHelper.getObjectWithId<PlayerModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<PlayerModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.player,
            ...obj
        }, this.props.project));
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.update({
            name: e.currentTarget.value
        });
    }

    handleLivesChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.player.lives;
        }

        this.update({
            lives: val
        });
    }

    handleMoveSpeedChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.player.moveSpeed;
        }

        this.update({
            moveSpeed: val
        });
    }

    handleFocusedMoveSpeedChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.player.focusedMoveSpeed;
        }

        this.update({
            focusedMoveSpeed: val
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

    render = () =>
    {
        return (
            <div className="playerEdit col">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.player.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Sprite:</span>
                    <ObjectSelect
                        currentObjectId={this.player.spriteId}
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
                    <span className="label">Move Speed:</span>
                    <input
                        type="number"
                        onChange={this.handleMoveSpeedChange}
                        value={this.player.moveSpeed}
                    />
                    <span>pixels per frame</span>
                </div>
                <div className="row">
                    <span className="label">Lives:</span>
                    <input
                        type="number"
                        onChange={this.handleLivesChange}
                        value={this.player.lives}
                    />
                </div>
                <div className="row">
                    <span className="label">Focused Speed:</span>
                    <input
                        type="number"
                        onChange={this.handleFocusedMoveSpeedChange}
                        value={this.player.focusedMoveSpeed}
                    />
                    <span>pixels per frame</span>
                </div>
                <div className="row">
                    <span className="label">Script:</span>
                    <ObjectSelect
                        currentObjectId={this.player.scriptId}
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
