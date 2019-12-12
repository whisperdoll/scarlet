import React, { ChangeEvent } from 'react';
import './SpriteEdit.scss';
import { SpriteModel } from '../../../utils/datatypes';
const { dialog } = require("electron").remote;

interface Props
{
    sprite: SpriteModel;
    onUpdate: (sprite: SpriteModel) => any;
}

interface State
{
}

export default class SpriteEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.handleBrowse = this.handleBrowse.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
    }

    handleBrowse()
    {
        let paths = dialog.showOpenDialogSync({
            title: "Set Sprite...",
            filters:
            [
                {
                    name: "Image file",
                    extensions: [ "png", "jpg", "jpeg" ]
                },
                {
                    name: "All Files",
                    extensions: ["*"]
                }
            ],
            properties: [ "openFile" ]
        });

        if (paths && paths[0])
        {
            this.props.onUpdate({
                ...this.props.sprite,
                path: paths[0]
            });
        }
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        this.props.onUpdate({
            ...this.props.sprite,
            name: e.currentTarget.value
        });
    }

    render()
    {
        return (
            <div className="spriteEdit">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.sprite.name}
                    />
                </div>
                <img src={this.props.sprite.path} />
                <button
                    onClick={this.handleBrowse}
                >
                    Browse...
                </button>
            </div>
        );
    }
}
