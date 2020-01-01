import React from 'react';
import './BossEdit.scss';
import { BossModel, ProjectModel, BossFormModel } from '../../../utils/datatypes';
import { array_copy, array_remove_at } from '../../../utils/utils';
import BossFormEdit from './BossFormEdit/BossFormEdit';
import ObjectHelper from '../../../utils/ObjectHelper';
import update from "immutability-helper";
import PathHelper from '../../../utils/PathHelper';

interface Props
{
    id: number;
    project: ProjectModel;
    onUpdate: (project: ProjectModel) => any;
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

    get boss(): BossModel
    {
        return ObjectHelper.getObjectWithId<BossModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<BossModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.boss,
            ...obj
        }, this.props.project));
    }

    handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        this.update({
            name: e.currentTarget.value
        });
    }

    addForm = () =>
    {
        let { obj, project } = ObjectHelper.createAndAddObject<BossFormModel>("bossForm", this.props.project);
        project = ObjectHelper.updateObject(this.props.id, update(this.boss, {
            formIds: {
                $push: [ obj.id ]
            }
        }), project);
        this.props.onUpdate(project);
    }

    handleFormRemove = (id: number) =>
    {
        // remove object //
        let project = ObjectHelper.removeObject(id, this.props.project);

        // unlink from boss //
        project = ObjectHelper.updateObject(this.props.id, update(this.boss, {
            formIds: {
                $splice: [[ this.boss.formIds.findIndex(_id => _id === id) ]]
            }
        }), project);

        this.props.onUpdate(project);
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
                        value={this.boss.name}
                    />
                </div>
                {this.boss.formIds.map((formId, i) =>
                (
                    <BossFormEdit
                        id={formId}
                        index={i}
                        onUpdate={this.props.onUpdate}
                        onRequestRemove={this.handleFormRemove}
                        project={this.props.project}
                        key={i}
                    />
                ))}
                <button onClick={this.addForm}>+ Add Form</button>
            </div>
        );
    }
}
