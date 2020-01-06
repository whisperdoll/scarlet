import React, { ChangeEvent } from 'react';
import './BackgroundEdit.scss';
import { BackgroundModel, ProjectModel } from '../../../utils/datatypes';
import ImageCache from '../../../utils/ImageCache';
import PathHelper from '../../../utils/PathHelper';
import ObjectHelper from '../../../utils/ObjectHelper';
const { dialog } = require("electron").remote;

interface Props
{
    obj: BackgroundModel;
    update: (obj: Partial<BackgroundModel>) => any;
}

interface State
{
}

export default class BackgroundEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleBrowse = () =>
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
            const destFilename = PathHelper.importObjectFileName(paths[0], "backgrounds");
            ImageCache.invalidateImage(this.props.obj.path);
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
            <div className="backgroundEdit col">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.obj.name}
                    />
                </div>
                <img alt="background" src={PathHelper.resolveObjectFileName(this.props.obj.path)} />
                <button
                    onClick={this.handleBrowse}
                >
                    Browse...
                </button>
            </div>
        );
    }
}
