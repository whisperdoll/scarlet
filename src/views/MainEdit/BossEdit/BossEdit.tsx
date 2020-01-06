import React from 'react';
import './BossEdit.scss';
import { BossModel, ProjectModel, BossFormModel } from '../../../utils/datatypes';
import { array_copy, array_remove_at } from '../../../utils/utils';
import BossFormEdit from './BossFormEdit/BossFormEdit';
import ObjectHelper from '../../../utils/ObjectHelper';
import update from "immutability-helper";
import PathHelper from '../../../utils/PathHelper';
import ObjectEdit from '../../../components/ObjectEdit/ObjectEdit';

interface Props
{
    obj: BossModel;
    update: (obj: Partial<BossModel>) => any;
    onRequestEdit: (id: number) => any;
}

interface State
{
}

export default class BossEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        this.props.update({
            name: e.currentTarget.value
        });
    }

    addForm = () =>
    {
        this.props.update({
            formIds: this.props.obj.formIds.concat([ ObjectHelper.createAndAddObject("bossForm") ])
        });
    }

    handleFormRemove = (id: number) =>
    {
        // remove from boss //
        this.props.update({
            formIds: update(this.props.obj.formIds, {
                $splice: [[ this.props.obj.formIds.findIndex(_id => _id === id) ]]
            })
        });

        // remove from project //
        ObjectHelper.removeObject(id);
    }

    render()
    {
        return (
            <div className="bossEdit col-8">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.props.obj.name}
                    />
                </div>
                {this.props.obj.formIds.map((formId, i) => (
                    <ObjectEdit
                        id={formId}
                        onRequestEdit={this.props.onRequestEdit}
                        index={i}
                        onRequestRemove={this.handleFormRemove}
                        key={formId}
                        showTitle={false}
                    />
                ))}
                <button onClick={this.addForm}>+ Add Form</button>
            </div>
        );
    }
}
