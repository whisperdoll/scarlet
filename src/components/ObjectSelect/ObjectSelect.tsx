import React, { ChangeEvent } from 'react';
import { ObjectModel, ProjectModel, ObjectType } from '../../utils/datatypes';
import ObjectCache from '../../utils/objectcache';

interface Props
{
    project: ProjectModel;
    objectType: ObjectType;
    currentObjectId: number;
    onChange: (objId: number) => any;
}

interface State
{
}

export default class ObjectSelect extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e: ChangeEvent<HTMLSelectElement>)
    {
        const id = parseInt(e.currentTarget.selectedOptions[0].value);

        if (!isNaN(id))
        {
            this.props.onChange(id);
        }
        else
        {
            throw "uhhhh weird id!";
        }
    }

    render()
    {
        return (
            <select
                onChange={this.handleChange}
                value={this.props.currentObjectId.toString()}
            >
                <option key={-1} value="-1">(None)</option>
                {ObjectCache.collectionFromType(this.props.objectType, this.props.project).collection.map((obj) =>
                {
                   return <option key={obj.id} value={obj.id.toString()}>{obj.name}</option> 
                })}
            </select>
        );
    }
}
