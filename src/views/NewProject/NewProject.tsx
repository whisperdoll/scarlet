import React, { ChangeEvent } from 'react';
import './NewProject.scss';
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
    }

    handlePathChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        const val = e.currentTarget.value;
        this.setState(state => ({
            ...this.state,
            path: val
        }));
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        const val = e.currentTarget.value;
        this.setState(state => ({
            ...this.state,
            name: val
        }));
    }

    handleBrowse = () =>
    {
        let path = dialog.showOpenDialogSync({
            title: "Add Path...",
            properties: [ "openDirectory" ]
        });

        if (path)
        {
            UserSettings.set("newProjectPath", path[0]);
            this.setState(state => ({
                ...state,
                path: (path as string[])[0]
            }));
        }
    }

    handleCreate = () =>
    {
        const project: ProjectModel = {
            name: this.state.name,
            objects: [],
            settings: {
                keyBindings: {
                    up: "arrowup",
                    down: "arrowdown",
                    left: "arrowleft",
                    right: "arrowright",
                    fire: "z",
                    bomb: "x",
                    focus: "shift"
                },
                stageIdOrder: [],
                fps: 60,
                resolutionX: 800,
                resolutionY: 600,
                stageResolutionX: 384,
                stageResolutionY: 448
            }
        };

        this.props.onCreate(project, this.state.path);
    }

    render = () =>
    {
        return (
            <div id="newProjectView">
                <h1>new project</h1>
                <div className="col">
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
            </div>
        );
    }
}
