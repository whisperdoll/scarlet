import React, { ChangeEvent } from 'react';
import './ScriptEdit.scss';
import { ScriptModel } from '../../../utils/datatypes';
import * as fs from "fs";
import PathHelper from '../../../utils/PathHelper';
const { dialog } = require("electron").remote;

interface Props
{
    obj: ScriptModel;
    update: (obj: Partial<ScriptModel>) => any;
}

interface State
{
    code: string;
}

export default class ScriptEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            code: ""
        };
    }

    componentDidMount = () =>
    {
        this.loadPreview();
    }

    loadPreview = () =>
    {
        const filename = PathHelper.resolveObjectFileName(this.props.obj.path);
        fs.readFile(filename, "utf8", (err, data) =>
        {
            this.setState((state) => ({
                ...state,
                code: err ? "error reading path" : data
            }));
        });
    }

    handleBrowse = () =>
    {
        let paths = dialog.showOpenDialogSync({
            title: "Set Script...",
            filters:
            [
                {
                    name: "Image file",
                    extensions: [ "js" ]
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
            this.props.update({
                path: PathHelper.importObjectFileName(paths[0], "scripts")
            });
        }
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.update({
            name: e.currentTarget.value
        });
    }

    componentDidUpdate = (prevProps: Props, prevState: State) =>
    {
        const prevScript = prevProps.obj;

        if (prevScript.path !== this.props.obj.path)
        {
            this.loadPreview();
        }
    }

    render = () =>
    {
        return (
            <div className="scriptEdit col">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.obj.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Path:</span>
                    <span>{this.props.obj.path || "<none>"}</span>
                    <button onClick={this.handleBrowse}>
                        Browse...
                    </button>
                </div>
                <code>
                    {this.state.code}
                </code>
            </div>
        );
    }
}
