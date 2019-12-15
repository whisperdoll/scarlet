import React, { ChangeEvent } from 'react';
import './BackgroundEdit.scss';
import { BackgroundModel } from '../../../utils/datatypes';
const { dialog } = require("electron").remote;

interface Props
{
    background: BackgroundModel;
    onUpdate: (background: BackgroundModel) => any;
}

interface State
{
}

export default class BackgroundEdit extends React.PureComponent<Props, State>
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
                ...this.props.background,
                path: paths[0]
            });
        }
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        this.props.onUpdate({
            ...this.props.background,
            name: e.currentTarget.value
        });
    }

    render()
    {
        return (
            <div className="backgroundEdit">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.background.name}
                    />
                </div>
                <img alt="background" src={this.props.background.path} />
                <button
                    onClick={this.handleBrowse}
                >
                    Browse...
                </button>
            </div>
        );
    }
}
