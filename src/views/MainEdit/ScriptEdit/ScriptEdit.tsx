import React, { ChangeEvent } from 'react';
import './ScriptEdit.scss';
import { ScriptModel, ProjectModel } from '../../../utils/datatypes';
import * as fs from "fs";
import PathHelper from '../../../utils/PathHelper';
import ObjectHelper from '../../../utils/ObjectHelper';
const { dialog } = require("electron").remote;

interface Props
{
    id: number;
    project: ProjectModel;
    onUpdate: (project: ProjectModel) => any;
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

    get script(): ScriptModel
    {
        return ObjectHelper.getObjectWithId<ScriptModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<ScriptModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.script,
            ...obj
        }, this.props.project));
    }

    componentDidMount = () =>
    {
        this.loadPreview();
    }

    loadPreview = () =>
    {
        const filename = PathHelper.resolveObjectFileName(this.script.path);
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
            this.update({
                path: PathHelper.importObjectFileName(paths[0], "scripts")
            });
        }
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.update({
            name: e.currentTarget.value
        });
    }

    componentDidUpdate = (prevProps: Props, prevState: State) =>
    {
        const prevScript = ObjectHelper.getObjectWithId<ScriptModel>(prevProps.id, prevProps.project);

        if (prevScript?.path !== this.script.path)
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
                        value={this.script.name}
                    />
                </div>
                <div className="row">
                    <span className="label">Path:</span>
                    <span>{this.script.path || "<none>"}</span>
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
