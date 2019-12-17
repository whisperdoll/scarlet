import React, { ChangeEvent } from 'react';
import './StageTimeline.scss';
import { StageModel, ProjectModel, SpriteModel, StageEnemyData, EnemyModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../../components/ObjectSelect/ObjectSelect";
import { obj_copy, array_copy } from '../../../../../utils/utils';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    time: number;
    handleTimeChange: (time: number) => any;
    selectedEnemyIndex: number;
}

interface State
{
}

export default class StageTimeline extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.handleTimeChange = this.handleTimeChange.bind(this);
        this.spritePathForEnemy = this.spritePathForEnemy.bind(this);
    }

    handleTimeChange(e: ChangeEvent<HTMLInputElement>)
    {
        const timeSeconds = parseFloat(e.currentTarget.value);
        if (!isNaN(timeSeconds))
        {
            this.props.handleTimeChange(timeSeconds);
        }
    }

    spritePathForEnemy(enemyData: StageEnemyData)
    {
        const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, this.props.project);
        if (enemy)
        {
            const sprite = ObjectHelper.getObjectWithId<SpriteModel>(enemy.spriteId, this.props.project);
            if (sprite)
            {
                return sprite.path;
            }
        }

        return "";
    }

    render()
    {
        return (
            <div className="timeline">
                <div className="enemyTimeline">
                    {this.props.stage.enemies.map((enemy, i) =>
                    {
                        return (
                            <img
                                src={this.spritePathForEnemy(enemy)}
                                style={{
                                    position: "absolute",
                                    left: (enemy.spawnTime / this.props.stage.lengthSeconds * 100).toString() + "%",
                                    transform: "translate(-50%, 0)",
                                    height: "32px"
                                }}
                                title={enemy.instanceName}
                                key={i}
                                className={i === this.props.selectedEnemyIndex ? "selected" : ""}
                            />
                        );
                    })}
                </div>
                <input
                    type="range"
                    onChange={this.handleTimeChange}
                    min="0"
                    max={this.props.stage.lengthSeconds.toString()}
                    step="0.01"
                    value={this.props.time.toString()}
                />
            </div>
        );
    }
}
