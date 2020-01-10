import React from 'react';
import './KeyBindEdit.scss';
import { KeyBindings } from '../../../utils/datatypes';
import update from "immutability-helper";
import ObjectHelper from '../../../utils/ObjectHelper';

interface Props
{
    keyBindings: KeyBindings;
    onUpdate: (keyBindings: KeyBindings) => any;
}

interface State
{
}

export default class KeyBindEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
    {
        this.props.onUpdate(update(ObjectHelper.project!.settings.keyBindings, {
            [e.currentTarget.dataset.key as string]: {
                $set: e.key.toLowerCase()
            }
        }));
    }

    render = () =>
    {
        const bindings = [ "Fire", "Bomb", "Left", "Right", "Up", "Down", "Focus" ];

        return (
            <div className="keyBindEdit col">
                {bindings.map((binding) =>
                {
                    const key = binding.toLowerCase();
                    return (
                        <div className="row" key={binding}>
                            <span className="label">{binding}:</span>
                            <input
                                type="text"
                                onKeyDown={this.handleKeyDown}
                                value={this.props.keyBindings[key]}
                                data-key={key}
                                readOnly={true}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }
}
