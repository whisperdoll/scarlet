import React, { ChangeEvent } from 'react';
import './PlayerEdit.scss';
import { PlayerModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectCache from '../../../utils/objectcache';
const { dialog } = require("electron").remote;

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

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleSpriteChange = this.handleSpriteChange.bind(this);
    }

    private get sprite(): SpriteModel | null
    {
        return ObjectCache.getObjectWithId<SpriteModel>(this.props.player.spriteId) || null;
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        this.props.onUpdate({
            ...this.props.player,
            name: e.currentTarget.value
        });
    }

    handleSpriteChange(e: ChangeEvent<HTMLSelectElement>)
    {
        const id = parseInt(e.currentTarget.selectedOptions[0].value);

        if (!isNaN(id))
        {
            this.props.onUpdate({
                ...this.props.player,
                spriteId: id
            });
        }
    }

    render()
    {
        return (
            <div className="playerEdit">
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
                    <select
                        onChange={this.handleSpriteChange}
                        value={this.sprite ? this.sprite.id.toString() : "-1"}
                    >
                        <option value="-1">(None)</option>
                        {ObjectCache.collectionFromType("sprite", this.props.project).collection.map((sprite) =>
                        {
                           return <option value={sprite.id.toString()}>{sprite.name}</option> 
                        })}
                    </select>
                    {this.sprite && <img className="sprite" src={this.sprite.path} />}
                </div>
            </div>
        );
    }
}
