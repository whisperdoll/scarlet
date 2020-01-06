import React from 'react';
import './KeyBindEdit.scss';
import { KeyBindings } from '../../../utils/datatypes';
import update from "immutability-helper";
import ObjectHelper from '../../../utils/ObjectHelper';

interface Props
{
}

interface State
{
    keyBindings: KeyBindings;
}

export default class KeyBindEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            keyBindings: ObjectHelper.project!.keyBindings
        };
        
        ObjectHelper.subscribeToKeyBindings(this.handleUpdateKeybindings);
    }

    componentDidMount = () =>
    {
    }

    componentWillUnmount = () =>
    {
        ObjectHelper.unsubscribeFromKeyBindings(this.handleUpdateKeybindings);
    }

    handleUpdateKeybindings = (keyBindings: KeyBindings) =>
    {
        this.setState(state => ({
            ...state,
            keyBindings: keyBindings
        }));
    }

    handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
    {
        ObjectHelper.updateKeyBindings(update(ObjectHelper.project!.keyBindings, {
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
                                value={this.state.keyBindings[key]}
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
