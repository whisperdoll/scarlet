import React from 'react';
import './ObjectList.scss';
import ObjectItem from './ObjectItem/ObjectItem';
import { ObjectModel, ProjectModel, ObjectType, GameObjectTypes } from '../../../utils/datatypes';
import Point from '../../../utils/point';
import ContextMenu from '../../../components/ContextMenu/ContextMenu';
import ContextMenuItem from '../../../components/ContextMenu/ContextMenuItem';
import ObjectHelper from '../../../utils/ObjectHelper';
import FolderItem from './FolderItem/FolderItem';

interface Props
{
    project: ProjectModel;
    onCreate: (type: ObjectType) => any;
    onSelect: (id: number) => any;
}

interface State
{
    currentContextMenu: "folder" | "object" | "none";
    contextMenuPosition: Point;
    contextHint: string;
}

interface Folder
{
    name: string;
    hint: ObjectType;
    children: number[];
}

export default class ObjectList extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            contextHint: "",
            contextMenuPosition: new Point(),
            currentContextMenu: "none"
        };
    }

    // ADDTYPE //
    get rootObjects(): Folder[]
    {
        return [
            {
                name: "Stages",
                hint: "stage",
                children: []
            },
            {
                name: "Players",
                hint: "player",
                children: []
            },
            {
                name: "Enemies",
                hint: "enemy",
                children: []
            },
            {
                name: "Bosses",
                hint: "boss",
                children: []
            },
            {
                name: "Bullets",
                hint: "bullet",
                children: []
            },
            {
                name: "Sprites",
                hint: "sprite",
                children: []
            },
            {
                name: "Backgrounds",
                hint: "background",
                children: []
            },
            {
                name: "Scripts",
                hint: "script",
                children: []
            }
        ];
    }

    componentDidMount = () =>
    {
        document.addEventListener("click", () =>
        {
            this.setState(state => ({
                ...state,
                currentContextMenu: "none"
            }));
        });
    }

    handleFolderContextMenu = (hint: ObjectType, position: Point) =>
    {
        this.setState(state => ({
            ...state,
            currentContextMenu: "folder",
            contextMenuPosition: position,
            contextHint: hint
        }));
    }

    handleObjectContextMenu = (id: number, position: Point) =>
    {

    }

    handleCreate = () =>
    {
        const type = this.state.contextHint as ObjectType;
        this.props.onCreate(type);
    }

    handleSelect = (id: number) =>
    {
        this.props.onSelect(id);
    }

    render = () =>
    {
        const objs = this.rootObjects;

        // make folders //
        GameObjectTypes.forEach((type) =>
        {
            const c = objs.find(o => o.hint === type)!.children as number[];
            c.push(...ObjectHelper.getObjectsWithType(type, this.props.project).map(o => o.id));
        });

        return (
            <div className="fullSize noScroll">
                <div className="objectList">
                    {objs.map((o, i) => (
                        <FolderItem
                            hint={o.hint}
                            name={o.name}
                            onContextMenu={this.handleFolderContextMenu}
                            onSelect={this.handleSelect}
                            key={i}
                        >
                            {o.children.map((child) => (
                                <ObjectItem
                                    id={child}
                                    key={child}
                                    project={this.props.project}
                                    onContextMenu={this.handleObjectContextMenu}
                                    onSelect={this.props.onSelect}
                                />
                            ))}
                        </FolderItem>
                    ))}
                </div>
                <ContextMenu
                    showing={this.state.currentContextMenu === "folder"}
                    x={this.state.contextMenuPosition.x}
                    y={this.state.contextMenuPosition.y}
                    children={(
                        <ContextMenuItem
                            text={"Create new " + this.state.contextHint + "..."}
                            onClick={this.handleCreate}
                            showing={true}
                        />
                    )}
                />
            </div>
        );
    }
}
