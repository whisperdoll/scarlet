import React from 'react';
import './KeyBindEdit.scss';
import { ProjectModel, SpriteModel } from '../../../utils/datatypes';
import update from "immutability-helper";

interface Props
{
    project: ProjectModel;
    onUpdate: (project: ProjectModel) => any;
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
        const project = update(this.props.project, {
            keyBindings: {
                [e.currentTarget.dataset.key as string]: {
                    $set: e.key
                }
            }
        });

        this.props.onUpdate(project);
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
                                value={this.props.project.keyBindings[key]}
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
