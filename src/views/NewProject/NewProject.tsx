import React, { ChangeEvent } from 'react';
import './NewProject.scss';
import * as npath from "path";
import * as os from "os";
import UserSettings from '../../utils/usersettings';
import { ProjectModel } from '../../utils/datatypes';
const { dialog } = require("electron").remote;

interface Props
{
    onCreate: (project: ProjectModel, parentDirectory: string) => any;
}

interface State
{
    name: string;
    path: string;
}

export default class NewProjectView extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            name: "New Project",
            path: UserSettings.get("newProjectPath", os.homedir())
        };

        this.handlePathChange = this.handlePathChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleBrowse = this.handleBrowse.bind(this);
        this.handleCreate = this.handleCreate.bind(this);
    }

    handlePathChange(e: ChangeEvent<HTMLInputElement>)
    {
        const val = e.currentTarget.value;
        this.setState((state) =>
        {
            return {
                ...this.state,
                path: val
            };
        });
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        const val = e.currentTarget.value;
        this.setState((state) =>
        {
            return {
                ...this.state,
                name: val
            };
        });
    }

    handleBrowse()
    {
        let path = dialog.showOpenDialogSync({
            title: "Add Path...",
            properties: [ "openDirectory" ]
        });

        if (path)
        {
            UserSettings.set("newProjectPath", path[0]);
            this.setState((state) =>
            {
                return {
                    ...state,
                    path: (path as string[])[0]
                };
            });
        }
    }

    handleCreate()
    {
        let project: ProjectModel = {
            name: this.state.name,
            objects: []
        };

        this.props.onCreate(project, this.state.path);
    }

    render()
    {
        return (
            <div id="newProjectView">
                <h1>new project</h1>
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        value={this.state.name}
                        onChange={this.handleNameChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Path:</span>
                    <input
                        type="text"
                        value={this.state.path}
                        onChange={this.handlePathChange}
                    />
                    <button
                        onClick={this.handleBrowse}
                    >
                        Browse...
                    </button>
                </div>
                <span>A new folder will be created here for your project.</span>
                <button onClick={this.handleCreate}>Create</button>
            </div>
        );
    }
}
