import React from 'react';
import './App.scss';
import HomeView from './views/Home/Home';
import NewProjectView from './views/NewProject/NewProject';
import MainEditView from './views/MainEdit/MainEdit';
import { ProjectModel } from './utils/datatypes';
import UserSettings from './utils/usersettings';
import * as fs from "fs";
import * as path from "path";
import ObjectHelper from './utils/ObjectHelper';
import ImageCache from './utils/ImageCache';
import ScriptEngine from './utils/ScriptEngine';
import PathHelper from './utils/PathHelper';
const { remote } = require('electron');
const { Menu, MenuItem, dialog } = remote;

interface Props
{
}

interface ContextMenuInfo
{
    showing: boolean;
    x: number;
    y: number;
    context: any;
}

type View = "Home" | "NewProject" | "MainEdit" | "StageEdit";

interface State
{
    currentView: View;
    project: ProjectModel | null;
    dirty: boolean;
    projectFilename: string;
}

export default class App extends React.PureComponent<Props, State>
{

    constructor(props: Props)
    {
        super(props);

        UserSettings.init("songsing_scarlet", true);

        this.state = {
            currentView: "Home",
            project: null,
            dirty: false,
            projectFilename: ""
        };

        this.handleNewProject = this.handleNewProject.bind(this);
        this.handleOpenProject = this.handleOpenProject.bind(this);
        this.handleCreateProject = this.handleCreateProject.bind(this);
        this.handleUpdateProject = this.handleUpdateProject.bind(this);
        this.handleSaveProject = this.handleSaveProject.bind(this);
    }

    componentDidMount()
    {
        console.log(process.version);
        const fileMenu = new Menu();

        fileMenu.append(new MenuItem({
            label: "New Project",
            accelerator: "CmdOrCtrl+N",
            click: this.handleNewProject
        }));
        fileMenu.append(new MenuItem({
            label: "Open Project...",
            accelerator: "CmdOrCtrl+O",
            click: this.handleOpenProject
        }));
        fileMenu.append(new MenuItem({
            label: "Save Project",
            accelerator: "CmdOrCtrl+S",
            click: () => this.handleSaveProject()
        }));

        const debugMenu = new Menu();

        debugMenu.append(new MenuItem({
            label: "Reload",
            accelerator: "CmdOrCtrl+R",
            role: "reload"
        }));

        debugMenu.append(new MenuItem({
            label: "Toggle Dev Tools",
            accelerator: "CmdOrCtrl+Shift+I",
            role: "toggleDevTools"
        }));

        const menu = new Menu();
        menu.append(new MenuItem({
            label: "File",
            submenu: fileMenu
        }));
        menu.append(new MenuItem({
            label: "Debug",
            submenu: debugMenu
        }));

        remote.getCurrentWindow().setMenu(menu);
        this.setTitle();
    }

    public genProjectFilename(project: ProjectModel, folderPath: string): string
    {
        return path.join(folderPath, project.name + ".scarlet");
    }

    public genProjectFolderPath(project: ProjectModel, parentDirectory: string): string
    {
        return path.join(parentDirectory, project.name);
    }

    setTitle()
    {
        if (this.state.project)
        {
            remote.getCurrentWindow().setTitle((this.state.dirty ? "*" : "") + "Scarlet - " + this.state.project.name);
        }
        else
        {
            remote.getCurrentWindow().setTitle("Scarlet");
        }
    }

    handleNewProject()
    {
        if (this.state.project)
        {
            this.handleSaveProject();
        }

        this.setState((state) =>
        {
            return {
                ...state,
                project: null,
                currentView: "NewProject",
                dirty: false,
                projectFilename: ""
            }
        });
    }

    handleOpenProject()
    {
        const paths = dialog.showOpenDialogSync({
            title: "Open Project...",
            properties: [ "openFile" ],
            filters: [{ name: "Scarlet Project File", extensions: [ "scarlet" ] }]
        });

        if (paths && paths[0])
        {
            if (this.state.project)
            {
                this.handleSaveProject();
            }
            
            const projectText = fs.readFileSync(paths[0], "utf8");
            let project: ProjectModel;

            try
            {
                project = JSON.parse(projectText);
            }
            catch (e)
            {
                alert("Error opening project - see console for details");
                console.log(e);
                return;
            }

            project = ObjectHelper.init(project);
            this.setState((state) =>
            {
                return {
                    ...state,
                    project: project,
                    currentView: "MainEdit",
                    dirty: false,
                    projectFilename: paths[0]
                };
            });
        }
    }

    handleCreateProject(project: ProjectModel, parentDirectory: string)
    {
        const folderPath = this.genProjectFolderPath(project, parentDirectory);

        try
        {
            // ADDTYPE
            fs.mkdirSync(folderPath);
            fs.mkdirSync(path.join(folderPath, "sprites"));
            fs.mkdirSync(path.join(folderPath, "scripts"));
            fs.mkdirSync(path.join(folderPath, "backgrounds"));
        }
        catch (e)
        {
            if (e.code === "EEXIST")
            {
                alert("A project with that name already exists! >:~0");
                return;
            }
            
            throw e;
        }

        project = ObjectHelper.init(project);
        const filename = this.genProjectFilename(project, folderPath);
        this.setState((state) =>
        {
            return {
                ...state,
                currentView: "MainEdit",
                project: project,
                projectFilename: filename
            };
        });
        this.handleSaveProject(project, filename);
    }

    handleUpdateProject(project: ProjectModel)
    {
        this.setState((state) =>
        {
            return {
                ...state,
                project: project,
                dirty: true
            };
        });
    }

    handleSaveProject(project?: ProjectModel | null, filename?: string)
    {
        if (!project) project = this.state.project;
        if (!filename) filename = this.state.projectFilename;

        if (project)
        {
            fs.writeFileSync(
                filename,
                JSON.stringify(project),
                "utf8"
            );
            this.setState((state) =>
            {
                return {
                    ...state,
                    dirty: false
                };
            })
        }
        else
        {
            alert("ok u dont even have a project open -_-");
        }
    }

    componentDidUpdate()
    {
        this.setTitle();
        PathHelper.setProjectFilename(this.state.projectFilename);
    }

    render()
    {
        switch (this.state.currentView)
        {
            case "Home":
                return (
                    <HomeView
                        onNew={this.handleNewProject}
                        onOpen={this.handleOpenProject}
                    />
                );
            case "NewProject":
                return (
                    <NewProjectView
                        onCreate={this.handleCreateProject}
                    />
                )
            case "MainEdit":
                if (this.state.project === null) throw new Error("null project");
                return (
                    <MainEditView
                        project={this.state.project}
                        onUpdate={this.handleUpdateProject}
                        projectFilename={this.state.projectFilename}
                    />
                );
            case "StageEdit":
                if (this.state.project === null) throw new Error("null project");
                return (
                    <div>a</div>
                );
        }
    }
}
