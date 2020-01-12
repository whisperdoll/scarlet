import React, { MouseEvent } from 'react';
import './ObjectItem.scss';
import Point from '../../../../utils/point';
import ObjectHelper from '../../../../utils/ObjectHelper';
import { ObjectModel } from '../../../../utils/datatypes';

interface Props
{
    id: number;
    onContextMenu: (id: number, position: Point) => any;
    onSelect: (id: number) => any;
}

interface State
{
    isShowingChildren: boolean;
    obj: ObjectModel | null;
}

export default class ObjectItem extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        
        this.state = {
            isShowingChildren: true,
            obj: ObjectHelper.getObjectWithId(props.id)
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);

        ObjectHelper.subscribeToObject(this.props.id, this.handleSubscribedObjectUpdate);
    }

    static getDerivedStateFromProps = (props: Props, state: State) =>
    {
        return {
            ...state,
            obj: ObjectHelper.getObjectWithId(props.id)
        };
    }

    componentDidUpdate = (prevProps: Props) =>
    {
        if (prevProps.id !== this.props.id)
        {
            ObjectHelper.unsubscribeFromObject(prevProps.id, this.handleSubscribedObjectUpdate);
            ObjectHelper.subscribeToObject(this.props.id, this.handleSubscribedObjectUpdate);
        }
    }

    handleSubscribedObjectUpdate = (id: number, obj: ObjectModel | null) =>
    {
        if (id === this.props.id)
        {
            this.setState(state => ({
                ...state,
                obj: obj
            }));
        }
        else
        {
            console.error("bad update");
        }
    }

    componentWillUnmount = () =>
    {
        ObjectHelper.unsubscribeFromObject(this.props.id, this.handleSubscribedObjectUpdate);
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
                    {ObjectHelper.getObjectWithId(this.props.id)?.name || null}
                </span>
            </div>
        );
    }
}
