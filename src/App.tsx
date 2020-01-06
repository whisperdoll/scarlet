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
    dirty: boolean;
}

export default class App extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        UserSettings.init("songsing_scarlet", true);

        this.state = {
            currentView: "Home",
            dirty: false
        };
    }

    componentDidMount = () =>
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

    public genProjectFilename = (project: ProjectModel, folderPath: string): string =>
    {
        return path.join(folderPath, project.name + ".scarlet");
    }

    public genProjectFolderPath = (project: ProjectModel, parentDirectory: string): string =>
    {
        return path.join(parentDirectory, project.name);
    }

    setTitle = () =>
    {
        if (ObjectHelper.project)
        {
            remote.getCurrentWindow().setTitle((this.state.dirty ? "*" : "") + "Scarlet - " + ObjectHelper.project.name);
        }
        else
        {
            remote.getCurrentWindow().setTitle("Scarlet");
        }
    }

    handleNewProject = () =>
    {
        if (ObjectHelper.project)
        {
            this.handleSaveProject();
        }

        this.setState(state => ({
            ...state,
            currentView: "NewProject",
            dirty: false
        }));

        ObjectHelper.project = null;
        ObjectHelper.projectFilename = "";
    }

    handleOpenProject = () =>
    {
        const paths = dialog.showOpenDialogSync({
            title: "Open Project...",
            properties: [ "openFile" ],
            filters: [{ name: "Scarlet Project File", extensions: [ "scarlet" ] }]
        });

        if (paths && paths[0])
        {
            if (ObjectHelper.project)
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

            this.setState(state => ({
                ...state,
                currentView: "MainEdit",
                dirty: false
            }));

            ObjectHelper.project = project;
            ObjectHelper.projectFilename = paths[0];
        }
    }

    handleCreateProject = (project: ProjectModel, parentDirectory: string) =>
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

        const filename = this.genProjectFilename(project, folderPath);

        ObjectHelper.project = project;
        ObjectHelper.projectFilename = filename;
        this.handleSaveProject();
    }

    handleSaveProject = () =>
    {
        if (ObjectHelper.project)
        {
            fs.writeFileSync(
                ObjectHelper.projectFilename,
                JSON.stringify(ObjectHelper.project),
                "utf8"
            );
            this.setState(state => ({
                ...state,
                dirty: false
            }));
        }
        else
        {
            alert("ok u dont even have a project open -_-");
        }
    }

    componentDidUpdate = () =>
    {
        this.setTitle();
    }

    render = () =>
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
                if (ObjectHelper.project === null) throw new Error("null project");
                return (
                    <MainEditView />
                );
            case "StageEdit":
                if (ObjectHelper.project === null) throw new Error("null project");
                return (
                    <div>a</div>
                );
        }
    }
}
