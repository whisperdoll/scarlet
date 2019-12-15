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

        this.handleTypeChange = this.handleTypeChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleLifetimeChange = this.handleLifetimeChange.bind(this);
        this.handleSpawnAmountChange = this.handleSpawnAmountChange.bind(this);
        this.handleSpawnRateChange = this.handleSpawnRateChange.bind(this);
        this.handleSpawnTimeChange = this.handleSpawnTimeChange.bind(this);
        this.handleXChange = this.handleXChange.bind(this);
        this.handleYChange = this.handleYChange.bind(this);
    }

    get enemy(): StageEnemyData | null
    {
        if (this.props.enemyIndex >= 0)
        {
            return this.props.stage.enemies[this.props.enemyIndex];
        }
        else
        {
            return null;
        }
    }

    handleTypeChange(enemyId: number)
    {
        if (enemyId >= 0)
        {
            this.props.handleUpdate({
                ...(this.enemy as StageEnemyData),
                id: enemyId
            }, this.props.enemyIndex);
        }
    }

    handleNameChange(e: ChangeEvent<HTMLInputElement>)
    {
        this.props.handleUpdate({
            ...(this.enemy as StageEnemyData),
            instanceName: e.currentTarget.value
        }, this.props.enemyIndex);
    }

    handleXChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.position.x as number;
        }

        this.props.handleUpdate({
            ...(this.enemy as StageEnemyData),
            position: {
                ...(this.enemy as StageEnemyData).position,
                x: val
            }
        }, this.props.enemyIndex);
    }

    handleYChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.position.x as number;
        }

        this.props.handleUpdate({
            ...(this.enemy as StageEnemyData),
            position: {
                ...(this.enemy as StageEnemyData).position,
                y: val
            }
        }, this.props.enemyIndex);
    }

    handleSpawnTimeChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnTime as number;
        }

        this.props.handleUpdate({
            ...(this.enemy as StageEnemyData),
            spawnTime: val
        }, this.props.enemyIndex);
    }

    handleSpawnAmountChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnAmount as number;
        }

        this.props.handleUpdate({
            ...(this.enemy as StageEnemyData),
            spawnAmount: val
        }, this.props.enemyIndex);
    }

    handleSpawnRateChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnRate as number;
        }

        this.props.handleUpdate({
            ...(this.enemy as StageEnemyData),
            spawnRate: val
        }, this.props.enemyIndex);
    }

    handleLifetimeChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.lifetime as number;
        }

        this.props.handleUpdate({
            ...(this.enemy as StageEnemyData),
            lifetime: val
        }, this.props.enemyIndex);
    }

    render()
    {
        if (this.enemy)
        {
            return (
                <div className="propertyEdit">
                    <h2>Properties for {this.enemy.instanceName}</h2>
                    <div className="row">
                        <span className="label">Type:</span>
                        <ObjectSelect
                            currentObjectId={this.enemy.id}
                            objectType="enemy"
                            onChange={this.handleTypeChange}
                            project={this.props.project}
                        />
                    </div>
                    <div className="row">
                        <span className="label">Name:</span>
                        <input
                            type="text"
                            onChange={this.handleNameChange}
                            value={this.enemy.instanceName}
                        />
                    </div>
                    <div className="row">
                        <span className="label">Position.X:</span>
                        <input
                            type="number"
                            onChange={this.handleXChange}
                            value={this.enemy.position.x.toString()}
                        />
                    </div>
                    <div className="row">
                        <span className="label">Position.Y:</span>
                        <input
                            type="number"
                            onChange={this.handleYChange}
                            value={this.enemy.position.y.toString()}
                        />
                    </div>
                    <div className="row">
                        <span className="label">Spawn Time:</span>
                        <input
                            type="number"
                            onChange={this.handleSpawnTimeChange}
                            value={this.enemy.spawnTime.toString()}
                            step="0.1"
                        />
                    </div>
                    <div className="row">
                        <span className="label">Spawn Rate:</span>
                        <input
                            type="number"
                            onChange={this.handleSpawnRateChange}
                            value={this.enemy.spawnRate.toString()}
                            step="0.1"
                        />
                    </div>
                    <div className="row">
                        <span className="label">Spawn Amt:</span>
                        <input
                            type="number"
                            onChange={this.handleSpawnAmountChange}
                            value={this.enemy.spawnAmount.toString()}
                        />
                    </div>
                    <div className="row">
                        <span className="label">Lifetime:</span>
                        <input
                            type="number"
                            onChange={this.handleLifetimeChange}
                            value={this.enemy.lifetime.toString()}
                        />
                    </div>
                </div>
            );
        }
        else
        {
            return (
                <div className="propertyEdit">
                    <span>select or add an enemy to have its properties show up here</span>
                </div>
            );
        }
    }
}
