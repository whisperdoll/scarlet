import React, { ChangeEvent } from 'react';
import './EnemyList.scss';
import { StageModel, ProjectModel, SpriteModel, StageEnemyData } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../../components/ObjectSelect/ObjectSelect";
import { obj_copy, array_copy } from '../../../../../utils/utils';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    onSelectEnemy: (index: number) => any;
}

interface State
{
}

export default class EnemyList extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            selectedNewEnemyId: -1
        };

        this.handleEnemySelect = this.handleEnemySelect.bind(this);
    }

    handleEnemySelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>)
    {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index as string);
        this.props.onSelectEnemy(index);
    }

    render()
    {
        return (
            <div className="enemyList">
                {this.props.stage.data.enemies.map((enemy, i) => (
                    <div
                        className="enemyItem"
                        onClick={this.handleEnemySelect}
                        key={i}
                        data-index={i.toString()}
                    >
                        {enemy.instanceName}
                        <span className="enemyType">{" (" + ObjectHelper.getObjectWithId(enemy.id, this.props.project)?.name + ")"}</span>
                    </div>
                ))}
            </div>
        );
    }
}
