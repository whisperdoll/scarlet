import React, { ChangeEvent } from 'react';
import './SoundEdit.scss';
import { SoundModel } from '../../../utils/datatypes';
import ImageCache from '../../../utils/ImageCache';
import PathHelper from '../../../utils/PathHelper';
const { dialog } = require("electron").remote;

interface Props
{
    obj: SoundModel;
    update: (obj: Partial<SoundModel>) => any;
}

interface State
{
}

export default class SoundEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleBrowse = () =>
    {
        let paths = dialog.showOpenDialogSync({
            title: "Import Sound...",
            filters:
            [
                {
                    name: "Sound File",
                    extensions: [ "ogg", "wav" ]
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
            const destFilename = PathHelper.importObjectFileName(paths[0], "sounds");
            this.props.update({
                path: destFilename
            });
        }
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.update({
            name: e.currentTarget.value
        });
    }

    render = () =>
    {
        return (
            <div className="soundEdit col">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.obj.name}
                    />
                </div>
                {this.props.obj.path && (
                    <audio controls>
                        <source src={PathHelper.resolveObjectFileName(this.props.obj.path)} />
                    </audio>
                )}
                <button
                    onClick={this.handleBrowse}
                >
                    Browse...
                </button>
            </div>
        );
    }
}
