import React, { ChangeEvent } from 'react';
import './PlayerEdit.scss';
import { PlayerModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import AnimatedSpriteCanvas from "../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas";

interface Props
{
    obj: PlayerModel;
    update: (obj: Partial<PlayerModel>) => any;
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
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.obj.spriteId);
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.update({
            name: e.currentTarget.value
        });
    }

    handleLivesChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.obj.lives;
        }

        this.props.update({
            lives: val
        });
    }

    handleMoveSpeedChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.obj.moveSpeed;
        }

        this.props.update({
            moveSpeed: val
        });
    }

    handleFocusedMoveSpeedChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.obj.focusedMoveSpeed;
        }

        this.props.update({
            focusedMoveSpeed: val
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

    render = () =>
    {
        return (
            <div className="playerEdit col">
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
                    <span className="label">Move Speed:</span>
                    <input
                        type="number"
                        onChange={this.handleMoveSpeedChange}
                        value={this.props.obj.moveSpeed}
                    />
                    <span>pixels per frame</span>
                </div>
                <div className="row">
                    <span className="label">Lives:</span>
                    <input
                        type="number"
                        onChange={this.handleLivesChange}
                        value={this.props.obj.lives}
                    />
                </div>
                <div className="row">
                    <span className="label">Focused Speed:</span>
                    <input
                        type="number"
                        onChange={this.handleFocusedMoveSpeedChange}
                        value={this.props.obj.focusedMoveSpeed}
                    />
                    <span>pixels per frame</span>
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
