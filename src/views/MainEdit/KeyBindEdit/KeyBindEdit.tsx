import React, { ChangeEvent } from 'react';
import './KeyBindEdit.scss';
import { PlayerModel, ProjectModel, SpriteModel } from '../../../utils/datatypes';
import ObjectHelper from '../../../utils/ObjectHelper';
import ObjectSelect from "../../../components/ObjectSelect/ObjectSelect";
import { obj_copy } from '../../../utils/utils';

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
        const project = obj_copy(this.props.project) as ProjectModel;
        project.keyBindings = obj_copy(project.keyBindings);
        project.keyBindings[e.currentTarget.dataset.key as string] = e.key;
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
