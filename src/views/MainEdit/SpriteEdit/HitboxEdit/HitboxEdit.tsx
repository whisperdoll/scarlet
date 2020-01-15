import React from 'react';
import './HitboxEdit.scss';
import { Hitbox } from '../../../../utils/datatypes';
import ToggleButton from '../../../../components/ToggleButton/ToggleButton';

interface Props
{
    hitbox: Hitbox;
    index: number;
    onUpdate: (hitbox: Hitbox, index: number) => any;
    onRequestRemove: (index: number) => any;
}

interface State
{
}

export default class HitboxEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handlePositionXChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.hitbox.position.x;
        }

        this.props.onUpdate({
            ...this.props.hitbox,
            position: {
                x: val,
                y: this.props.hitbox.position.y
            }
        }, this.props.index);
    }

    handlePositionYChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.hitbox.position.y;
        }

        this.props.onUpdate({
            ...this.props.hitbox,
            position: {
                x: this.props.hitbox.position.x,
                y: val
            }
        }, this.props.index);
    }

    handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.hitbox.position.y;
        }

        this.props.onUpdate({
            ...this.props.hitbox,
            radius: Math.max(0, val)
        }, this.props.index);
    }

    handleRequestRemove = () =>
    {
        this.props.onRequestRemove(this.props.index);
    }

    handleToggleConsumablesOnly = (toggled: boolean) =>
    {
        this.props.onUpdate({
            ...this.props.hitbox,
            consumablesOnly: toggled
        }, this.props.index);
    }

    render = () =>
    {
        return (
            <div className="hitboxEdit col">
                <h2>Hitbox {this.props.index}</h2>
                <div className="row">
                    <span className="label">Position:</span>
                    <input
                        type="number"
                        onChange={this.handlePositionXChange}
                        value={this.props.hitbox.position.x}
                    />
                    <span>,</span>
                    <input
                        type="number"
                        onChange={this.handlePositionYChange}
                        value={this.props.hitbox.position.y}
                    />
                </div>
                <div className="row">
                    <span className="label">Radius:</span>
                    <input
                        type="number"
                        onChange={this.handleRadiusChange}
                        value={this.props.hitbox.radius}
                    />
                </div>
                <ToggleButton
                    onToggle={this.handleToggleConsumablesOnly}
                    toggled={this.props.hitbox.consumablesOnly}
                >
                    Consumables Only
                </ToggleButton>
                <button onClick={this.handleRequestRemove} className="remove">- Remove</button>
            </div>
        );
    }
}
