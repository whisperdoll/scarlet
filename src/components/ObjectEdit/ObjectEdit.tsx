import React from 'react';
import { ObjectModel } from '../../utils/datatypes';
import ObjectHelper from '../../utils/ObjectHelper';
import SpriteEdit from '../../views/MainEdit/SpriteEdit/SpriteEdit';
import PlayerEdit from '../../views/MainEdit/PlayerEdit/PlayerEdit';
import ScriptEdit from '../../views/MainEdit/ScriptEdit/ScriptEdit';
import EnemyEdit from '../../views/MainEdit/EnemyEdit/EnemyEdit';
import BulletEdit from '../../views/MainEdit/BulletEdit/BulletEdit';
import BossEdit from '../../views/MainEdit/BossEdit/BossEdit';
import StageEdit from '../../views/MainEdit/StageEdit/StageEdit';
import BackgroundEdit from '../../views/MainEdit/BackgroundEdit/BackgroundEdit';
import BossFormEdit from '../../views/MainEdit/BossEdit/BossFormEdit/BossFormEdit';
import SoundEdit from '../../views/MainEdit/SoundEdit/SoundEdit';
import ConsumableEdit from '../../views/MainEdit/ConsumableEdit/ConsumableEdit';

interface Props
{
    id: number;
    onRequestEdit: (id: number) => any;
    index?: number;
    onRequestRemove?: (id: number) => any;
    showTitle?: boolean;
}

interface State
{
    obj: ObjectModel | null;
}

export default class ObjectEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            obj: ObjectHelper.getObjectWithId(this.props.id)
        };

        ObjectHelper.subscribeToObject(this.props.id, this.handleSubscribedObjectUpdate);
    }

    get currentlyEditingObj(): ObjectModel | null
    {
        return ObjectHelper.getObjectWithId(this.props.id);
    }

    componentDidMount = () =>
    {
    }

    componentWillUnmount = () =>
    {
        ObjectHelper.unsubscribeFromObject(this.props.id, this.handleSubscribedObjectUpdate);
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

    handleChildObjectUpdate = (obj: any) =>
    {
        if (obj)
        {
            ObjectHelper.updateObject(this.props.id, {
                ...ObjectHelper.getObjectWithId(this.props.id),
                ...obj
            });
        }
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

    getEditor()
    {
        let component: any;

        // ADDTYPE
        if (this.currentlyEditingObj)
        {
            switch (this.currentlyEditingObj.type)
            {
                case "sprite": component = SpriteEdit; break;
                case "script": component = ScriptEdit; break;
                case "background": component = BackgroundEdit; break;
                case "boss": component = BossEdit; break;
                case "bossForm": component = BossFormEdit; break;
                case "bullet": component = BulletEdit; break;
                case "enemy": component = EnemyEdit; break;
                case "player": component = PlayerEdit; break;
                case "stage": component = StageEdit; break;
                case "sound": component = SoundEdit; break;
                case "consumable": component = ConsumableEdit; break;
            }
            
            return component;
        }

        return null;
    }

    render()
    {
        const Editor = this.getEditor();

        return (
            <div className="objectEdit">
                {(this.props.showTitle !== false) && <h1 className="noEmpty">{this.state.obj?.name}</h1>}
                {Editor && (
                    <Editor
                        obj={this.state.obj}
                        update={this.handleChildObjectUpdate}
                        onRequestEdit={this.props.onRequestEdit}
                        index={this.props.index}
                        onRequestRemove={this.props.onRequestRemove}
                    />
                )}
            </div>
        );
    }
}
