import React, { MouseEvent } from 'react';
import './ObjectItem.scss';
import { ObjectModel } from '../../../../utils/datatypes';
import Point from '../../../../utils/point';

interface Props
{
    model: ObjectModel;
    onContextMenu: (model: ObjectModel, position: Point) => any;
    onSelect: (model: ObjectModel) => any;
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
        if (this.props.model.type === "folder")
        {
            this.setState(state => ({
                ...state,
                isShowingChildren: !state.isShowingChildren
            }));
        }
        else
        {
            this.props.onSelect(this.props.model);
        }
    }

    handleContextMenu(e: React.MouseEvent)
    {
        this.props.onContextMenu(this.props.model, new Point(e.clientX, e.clientY));
    }

    render()
    {
        const isFolder = this.props.model.type === "folder";
        const children = this.props.model.children;
        const isShowingChildren = this.state.isShowingChildren;
        
        return (
            <div
                className="objectItem"
                onClick={this.handleClick}
                onContextMenu={this.handleContextMenu}
            >
                <span
                    className={(isFolder ? "noEmpty folderName " + (isShowingChildren ? "open" : "collapsed") : "noEmpty")}
                >
                    {this.props.model.name}
                </span>
                {isFolder && children && isShowingChildren && (
                    <div className="children">
                        {
                            children.map((child) =>
                            {
                                return (
                                    <ObjectItem
                                        model={child}
                                        key={child.id}
                                        onContextMenu={this.props.onContextMenu}
                                        onSelect={this.props.onSelect}
                                    />
                                )
                            })
                        }
                    </div>
                )}
            </div>
        );
    }
}
