import React, { MouseEvent } from 'react';
import './ObjectItem.scss';
import { ObjectModel, ProjectModel } from '../../../../utils/datatypes';
import Point from '../../../../utils/point';
import ObjectHelper from '../../../../utils/ObjectHelper';

interface Props
{
    id: number;
    project: ProjectModel;
    onContextMenu: (id: number, position: Point) => any;
    onSelect: (id: number) => any;
}

interface State
{
    isShowingChildren: boolean;
}

export default class ObjectItem extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        
        this.state = {
            isShowingChildren: true
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
    }

    handleClick(e: MouseEvent)
    {
        e.stopPropagation();
        this.props.onSelect(this.props.id);
    }

    handleContextMenu(e: React.MouseEvent)
    {
        this.props.onContextMenu(this.props.id, new Point(e.clientX, e.clientY));
    }

    render()
    {        
        return (
            <div
                className="objectItem"
                onClick={this.handleClick}
                onContextMenu={this.handleContextMenu}
            >
                <span className="noEmpty">
                    {ObjectHelper.getObjectWithId(this.props.id, this.props.project)?.name || null}
                </span>
            </div>
        );
    }
}
