import React, { ChangeEvent } from 'react';
import { ObjectType } from '../../utils/datatypes';
import ObjectHelper from '../../utils/ObjectHelper';

interface Props
{
    objectType: ObjectType;
    currentObjectId: number;
    onChange: (id: number, key?: number | string) => any;
    identifier?: string | number;
    onRequestEdit?: (id: number) => any;
}

interface State
{
}

export default class ObjectSelect extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleChange = (e: ChangeEvent<HTMLSelectElement>) =>
    {
        const id = parseInt(e.currentTarget.selectedOptions[0].value);

        if (!isNaN(id))
        {
            this.props.onChange(id, this.props.identifier);
        }
        else
        {
            throw new Error("uhhhh weird id!");
        }
    }

    handleEdit = () =>
    {
        this.props.onRequestEdit!(this.props.currentObjectId);
    }

    render = () =>
    {
        return (
            <React.Fragment>
                <select
                    onChange={this.handleChange}
                    value={this.props.currentObjectId.toString()}
                >
                    <option key={-1} value="-1">(None)</option>
                    {ObjectHelper.getObjectsWithType(this.props.objectType).map((obj) =>
                    (
                        <option key={obj.id} value={obj.id.toString()}>{obj.name}</option> 
                    ))}
                </select>
                {this.props.onRequestEdit && this.props.currentObjectId >= 0 && <button onClick={this.handleEdit}>Edit...</button>}
            </React.Fragment>
        );
    }
}
