import React, { MouseEvent } from 'react';
import { ObjectType } from '../../../../utils/datatypes';
import Point from '../../../../utils/point';

interface Props
{
    hint: ObjectType;
    name: string;
    onContextMenu: (hint: ObjectType, position: Point) => any;
    onSelect: (id: number) => any;
}

interface State
{
    isShowingChildren: boolean;
}

export default class FolderItem extends React.PureComponent<Props, State>
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
        this.setState(state => ({
            ...state,
            isShowingChildren: !state.isShowingChildren
        }));
    }

    handleContextMenu(e: React.MouseEvent)
    {
        this.props.onContextMenu(this.props.hint, new Point(e.clientX, e.clientY));
    }

    render()
    {
        const children = this.props.children;
        const isShowingChildren = this.state.isShowingChildren;
        
        return (
            <div
                className="objectItem"
                onClick={this.handleClick}
                onContextMenu={this.handleContextMenu}
            >
                <span
                    className={"noEmpty folderName " + (isShowingChildren ? "open" : "collapsed")}
                >
                    {this.props.name}
                </span>
                {children && isShowingChildren && (
                    <div className="children">
                        {children}
                    </div>
                )}
            </div>
        );
    }
}
