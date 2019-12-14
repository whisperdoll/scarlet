import React, { ChangeEvent } from 'react';
import './PropertyEdit.scss';
import { StageModel, ProjectModel, SpriteModel, StageEnemyData } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../../components/ObjectSelect/ObjectSelect";
import { obj_copy, array_copy } from '../../../../../utils/utils';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    enemyIndex: number;
    handleUpdate: (enemy: StageEnemyData, index: number) => any;
}

interface State
{
}

export default class PropertyEdit extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        
    }

    render()
    {
        return (
            <div className="propertyEdit">
                
            </div>
        );
    }
}
