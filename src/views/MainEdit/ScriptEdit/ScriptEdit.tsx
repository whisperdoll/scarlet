import React, { ChangeEvent } from 'react';
import './ScriptEdit.scss';
import { ScriptModel } from '../../../utils/datatypes';
import * as fs from "fs";
const { dialog } = require("electron").remote;

interface Props
{
    script: ScriptModel;
    onUpdate: (script: ScriptModel) => any;
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
        this.loadPreview(this.props.script.path);
    }

    loadPreview = (filename: string) =>
    {
        fs.readFile(filename, "utf8", (err, data) =>
        {
            if (!err)
            {
                this.setState((state) =>
                {
                    return {
                        ...state,
                        code: data
                    };
                });
            }
            else
            {
                this.setState((state) =>
                {
                    return {
                        ...state,
                        code: "error reading path"
                    };
                });
            }
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
            this.props.onUpdate({
                ...this.props.script,
                path: paths[0]
            });
        }
    }

    handlePathChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.onUpdate({
            ...this.props.script,
            path: e.currentTarget.value
        });
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.onUpdate({
            ...this.props.script,
            name: e.currentTarget.value
        });
    }

    componentDidUpdate = (prevProps: Props, prevState: State) =>
    {
        if (this.props.script.path !== prevProps.script.path)
        {
            this.loadPreview(this.props.script.path);
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
                        value={this.props.script.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Path:</span>
                    <input
                        type="text"
                        onChange={this.handlePathChange}
                        value={this.props.script.path}
                    />
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
