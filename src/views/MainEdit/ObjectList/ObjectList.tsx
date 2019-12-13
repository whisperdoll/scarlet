import React from 'react';
import './ObjectList.scss';
import ObjectItem from './ObjectItem/ObjectItem';
import { ObjectModel, ProjectModel, ObjectType } from '../../../utils/datatypes';
import Point from '../../../utils/point';
import ContextMenu from '../../../components/ContextMenu/ContextMenu';
import ContextMenuItem from '../../../components/ContextMenu/ContextMenuItem';
import ObjectCache from '../../../utils/objectcache';

interface Props
{
    project: ProjectModel;
    onCreate: (type: ObjectType) => any;
    onSelect: (obj: ObjectModel) => any;
}

interface State
{
    currentContextMenu: "folder" | "object" | "none";
    contextMenuPosition: Point;
    contextHint: string;
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

        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleCreate = this.handleCreate.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    get rootObjects(): ObjectModel[]
    {
        return [
            {
                id: -1,
                name: "Stages",
                type: "folder",
                hint: "stage",
                children: []
            },
            {
                id: -2,
                name: "Players",
                type: "folder",
                hint: "player",
                children: []
            },
            {
                id: -3,
                name: "Enemies",
                type: "folder",
                hint: "enemy",
                children: []
            },
            {
                id: -4,
                name: "Bosses",
                type: "folder",
                hint: "boss",
                children: []
            },
            {
                id: -5,
                name: "Bullets",
                type: "folder",
                hint: "bullet",
                children: []
            },
            {
                id: -6,
                name: "Sprites",
                type: "folder",
                hint: "sprite",
                children: []
            },
            {
                id: -7,
                name: "Scripts",
                type: "folder",
                hint: "script",
                children: []
            }
        ];
    }

    componentDidMount()
    {
        document.addEventListener("click", () =>
        {
            this.setState((state) =>
            {
                return {
                    ...state,
                    currentContextMenu: "none"
                };
            });
        });
    }

    handleContextMenu(model: ObjectModel, position: Point)
    {
        if (model.type === "folder")
        {
            this.setState((state) =>
            {
                return {
                    ...state,
                    currentContextMenu: "folder",
                    contextMenuPosition: position,
                    contextHint: model.hint as string
                }
            });
        }
    }

    handleCreate()
    {
        const type = this.state.contextHint as ObjectType;
        this.props.onCreate(type);
    }

    handleSelect(obj: ObjectModel)
    {
        this.props.onSelect(obj);
    }

    render()
    {
        const objs = this.rootObjects;

        const c = (type: ObjectType) => objs.find(o => o.hint === type)?.children as ObjectModel[];
        const p = (type: ObjectType) =>
        {
            c(type).push(...ObjectCache.collectionFromType(type, this.props.project).collection);
        };

        // ADDTYPE
        p("sprite");
        p("player");
        p("script");
        p("enemy");
        p("bullet");
        p("boss");

        const objEls = objs.map((o) =>
        {
            return (
                <ObjectItem
                    model={o}
                    onContextMenu={this.handleContextMenu}
                    onSelect={this.handleSelect}
                    key={o.id}
                />
            );
        })

        return (
            <div className="fullSize">
                <div className="objectList">
                    {objEls}
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
