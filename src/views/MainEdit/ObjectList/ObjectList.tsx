import React from 'react';
import './ObjectList.scss';
import ObjectItem from './ObjectItem/ObjectItem';
import { ObjectType, GameObjectTypes } from '../../../utils/datatypes';
import Point from '../../../utils/point';
import ContextMenu from '../../../components/ContextMenu/ContextMenu';
import ContextMenuItem from '../../../components/ContextMenu/ContextMenuItem';
import ObjectHelper from '../../../utils/ObjectHelper';
import FolderItem from './FolderItem/FolderItem';

interface Props
{
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
    childIds: number[];
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
                childIds: []
            },
            {
                name: "Players",
                hint: "player",
                childIds: []
            },
            {
                name: "Enemies",
                hint: "enemy",
                childIds: []
            },
            {
                name: "Bosses",
                hint: "boss",
                childIds: []
            },
            {
                name: "Bullets",
                hint: "bullet",
                childIds: []
            },
            {
                name: "Consumables",
                hint: "consumable",
                childIds: []
            },
            {
                name: "Sprites",
                hint: "sprite",
                childIds: []
            },
            {
                name: "Backgrounds",
                hint: "background",
                childIds: []
            },
            {
                name: "Scripts",
                hint: "script",
                childIds: []
            },
            {
                name: "Sounds",
                hint: "sound",
                childIds: []
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
        objs.forEach((rootObj) =>
        {
            rootObj.childIds.push(...ObjectHelper.getObjectsWithType(rootObj.hint).map(o => o.id));
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
                            {o.childIds.map((childId) => (
                                <ObjectItem
                                    id={childId}
                                    key={childId}
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
