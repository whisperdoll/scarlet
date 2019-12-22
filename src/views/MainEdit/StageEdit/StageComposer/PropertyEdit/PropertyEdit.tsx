import React, { ChangeEvent } from 'react';
import './PropertyEdit.scss';
import { StageModel, ProjectModel, StageEnemyData } from '../../../../../utils/datatypes';
import ObjectSelect from "../../../../../components/ObjectSelect/ObjectSelect";

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    enemyIndex: number;
    onUpdate: (enemy: StageEnemyData, index: number) => any;
    onDeselectEnemy: () => any;
    onRequestRemoveEnemy: (index: number) => any;
    enemyAliveCount: number;
    enemyBulletAliveCount: number;
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

    handleTypeChange = (enemyId: number) =>
    {
        if (enemyId >= 0)
        {
            this.props.onUpdate({
                ...(this.enemy as StageEnemyData),
                id: enemyId
            }, this.props.enemyIndex);
        }
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.onUpdate({
            ...(this.enemy as StageEnemyData),
            instanceName: e.currentTarget.value
        }, this.props.enemyIndex);
    }

    handleXChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnPosition.x as number;
        }

        this.props.onUpdate({
            ...(this.enemy as StageEnemyData),
            spawnPosition: {
                ...(this.enemy as StageEnemyData).spawnPosition,
                x: val
            }
        }, this.props.enemyIndex);
    }

    handleYChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnPosition.x as number;
        }

        this.props.onUpdate({
            ...(this.enemy as StageEnemyData),
            spawnPosition: {
                ...(this.enemy as StageEnemyData).spawnPosition,
                y: val
            }
        }, this.props.enemyIndex);
    }

    handleSpawnTimeChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnFrame as number;
        }

        this.props.onUpdate({
            ...(this.enemy as StageEnemyData),
            spawnFrame: val
        }, this.props.enemyIndex);
    }

    handleSpawnAmountChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnAmount as number;
        }

        this.props.onUpdate({
            ...(this.enemy as StageEnemyData),
            spawnAmount: val
        }, this.props.enemyIndex);
    }

    handleSpawnRateChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.enemy?.spawnRate as number;
        }

        this.props.onUpdate({
            ...(this.enemy as StageEnemyData),
            spawnRate: val
        }, this.props.enemyIndex);
    }

    handleDeselect = () =>
    {
        this.props.onDeselectEnemy();
    }

    handleRequestRemove = () =>
    {
        this.props.onRequestRemoveEnemy(this.props.enemyIndex);
    }

    render = () =>
    {
        if (this.enemy)
        {
            return (
                <div className="propertyEdit col">
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
                        <span className="label">Spawn Pos:</span>
                        <input
                            type="number"
                            onChange={this.handleXChange}
                            value={this.enemy.spawnPosition.x.toString()}
                        />
                        <span>,</span>
                        <input
                            type="number"
                            onChange={this.handleYChange}
                            value={this.enemy.spawnPosition.y.toString()}
                        />
                    </div>
                    <div className="row">
                        <span className="label">Spawn Time:</span>
                        <input
                            type="number"
                            onChange={this.handleSpawnTimeChange}
                            value={this.enemy.spawnFrame.toString()}
                            step="1"
                        />
                    </div>
                    <div className="row">
                        <span className="label">Spawn Rate:</span>
                        <input
                            type="number"
                            onChange={this.handleSpawnRateChange}
                            value={this.enemy.spawnRate.toString()}
                            step="1"
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
                    <button onClick={this.handleDeselect}>Deselect</button>
                    <button onClick={this.handleRequestRemove} className="remove">- Remove</button>
                    <div>Alive: {this.props.enemyAliveCount}</div>
                    <div>Bullets Alive: {this.props.enemyBulletAliveCount}</div>
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
