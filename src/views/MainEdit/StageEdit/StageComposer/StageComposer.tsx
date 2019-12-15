import React, { ChangeEvent } from 'react';
import './StageComposer.scss';
import { StageModel, ProjectModel, SpriteModel, StageEnemyData } from '../../../../utils/datatypes';
import ObjectHelper from '../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../components/ObjectSelect/ObjectSelect";
import EnemyList from './EnemyList/EnemyList';
import PropertyEdit from './PropertyEdit/PropertyEdit';
import StageRenderer from "./StageRenderer/StageRenderer";
import { array_copy } from '../../../../utils/utils';
import ScriptEngine from '../../../../utils/ScriptEngine';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    onUpdate: (stage: StageModel) => any;
    onBack: () => any;
}

interface State
{
    timeSeconds: number;
    selectedEnemyIndex: number;
    selectedNewEnemyId: number;
}

export default class StageComposer extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        
        this.state = {
            timeSeconds: 0,
            selectedEnemyIndex: -1,
            selectedNewEnemyId: -1
        };

        this.handleBack = this.handleBack.bind(this);
        this.handleLengthChange = this.handleLengthChange.bind(this);
        this.handleWidthChange = this.handleWidthChange.bind(this);
        this.handleHeightChange = this.handleHeightChange.bind(this);
        this.handleSpawnXChange = this.handleSpawnXChange.bind(this);
        this.handleSpawnYChange = this.handleSpawnYChange.bind(this);
        this.handleBackgroundChange = this.handleBackgroundChange.bind(this);
        this.handlePlayerChange = this.handlePlayerChange.bind(this);
        this.handleBossChange = this.handleBossChange.bind(this);
        this.handleTimelineChange = this.handleTimelineChange.bind(this);
        this.handleAddEnemy = this.handleAddEnemy.bind(this);
        this.handleSelectEnemy = this.handleSelectEnemy.bind(this);
        this.handleSelectNewEnemy = this.handleSelectNewEnemy.bind(this);
        this.handleAddEnemy = this.handleAddEnemy.bind(this);
        this.handleUpdateEnemy = this.handleUpdateEnemy.bind(this);
        this.refreshScripts = this.refreshScripts.bind(this);
    }

    refreshScripts()
    {
        ScriptEngine.updateCache(this.props.project);
    }

    componentDidMount()
    {
        this.refreshScripts();
    }

    handleBack()
    {
        this.props.onBack();
    }

    handleLengthChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.lengthSeconds;
        }

        this.props.onUpdate({
            ...this.props.stage,
            lengthSeconds: val
        });
    }

    handleWidthChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.size.x;
        }

        this.props.onUpdate({
            ...this.props.stage,
            size: {
                ...this.props.stage.size,
                x: val
            }
        });
    }

    handleHeightChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.size.y;
        }

        this.props.onUpdate({
            ...this.props.stage,
            size: {
                ...this.props.stage.size,
                y: val
            }
        });
    }

    handleSpawnXChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.size.y;
        }

        this.props.onUpdate({
            ...this.props.stage,
            playerSpawnPosition: {
                ...this.props.stage.playerSpawnPosition,
                x: val
            }
        });
    }

    handleSpawnYChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.size.y;
        }

        this.props.onUpdate({
            ...this.props.stage,
            playerSpawnPosition: {
                ...this.props.stage.playerSpawnPosition,
                y: val
            }
        });
    }

    handleBackgroundChange(backgroundId: number)
    {
        this.props.onUpdate({
            ...this.props.stage,
            backgroundId: backgroundId
        });
    }

    handlePlayerChange(playerId: number)
    {
        this.props.onUpdate({
            ...this.props.stage,
            playerId: playerId
        });
    }

    handleBossChange(bossId: number)
    {
        this.props.onUpdate({
            ...this.props.stage,
            bossId: bossId
        });
    }

    handleTimelineChange(e: ChangeEvent<HTMLInputElement>)
    {
        const timeSeconds = parseFloat(e.currentTarget.value);
        this.setState((state) =>
        {
            return {
                ...state,
                timeSeconds: timeSeconds
            };
        });
    }

    handleAddEnemy()
    {
        if (this.state.selectedNewEnemyId >= 0)
        {
            this.props.onUpdate({
                ...this.props.stage,
                enemies: this.props.stage.enemies.concat([{
                    id: this.state.selectedNewEnemyId,
                    instanceName: "New Enemy " + this.props.stage.enemies.length.toString(),
                    lifetime: -1,
                    position: {
                        x: 0,
                        y: 0
                    },
                    spawnAmount: 1,
                    spawnRate: 0,
                    spawnTime: this.state.timeSeconds
                }])
            });
        }
    }

    handleSelectEnemy(index: number)
    {
        this.setState((state) =>
        {
            return {
                ...state,
                selectedEnemyIndex: index
            };
        });
    }

    handleSelectNewEnemy(newEnemyId: number)
    {
        this.setState((state) =>
        {
            return {
                ...state,
                selectedNewEnemyId: newEnemyId
            };
        });
    }

    handleUpdateEnemy(enemy: StageEnemyData, index: number)
    {
        const enemies = array_copy(this.props.stage.enemies);
        enemies[index] = enemy;

        this.props.onUpdate({
            ...this.props.stage,
            enemies: enemies
        });
    }

    render()
    {
        return (
            <div className="stageComposer">
                {/* header */}
                <div className="row header">
                    <button onClick={this.handleBack}>&lt; Back</button>
                    <h1>{this.props.stage.name}</h1>
                    <button
                        className="refreshScripts"
                        onClick={this.refreshScripts}
                    >
                        Refresh Scripts
                    </button>
                </div>
                {/* edit stuff */}
                <div className="row edit">
                    {/* left col */}
                    <div className="col stageInfo">
                        <div className="row">
                            <span className="label">Size:</span>
                            <input
                                type="number"
                                onChange={this.handleWidthChange}
                                value={this.props.stage.size.x.toString()}
                            />
                            <span>x</span>
                            <input
                                type="number"
                                onChange={this.handleHeightChange}
                                value={this.props.stage.size.y.toString()}
                            />
                        </div>
                        <div className="row">
                            <span className="label">Length:</span>
                            <input
                                type="number"
                                onChange={this.handleLengthChange}
                                value={this.props.stage.lengthSeconds.toString()}
                            />
                            <span>seconds</span>
                        </div>
                        <div className="row">
                            <span className="label">Background:</span>
                            <ObjectSelect
                                currentObjectId={this.props.stage.backgroundId}
                                objectType="background"
                                onChange={this.handleBackgroundChange}
                                project={this.props.project}
                            />
                        </div>
                        <div className="row">
                            <span className="label">Player:</span>
                            <ObjectSelect
                                currentObjectId={this.props.stage.playerId}
                                objectType="player"
                                onChange={this.handlePlayerChange}
                                project={this.props.project}
                            />
                        </div>
                        <div className="row">
                            <span className="label">Spawn Pos:</span>
                            <input
                                type="number"
                                onChange={this.handleSpawnXChange}
                                value={this.props.stage.playerSpawnPosition.x.toString()}
                            />
                            <span>x</span>
                            <input
                                type="number"
                                onChange={this.handleSpawnYChange}
                                value={this.props.stage.playerSpawnPosition.y.toString()}
                            />
                        </div>
                        <div className="row">
                            <span className="label">Boss:</span>
                            <ObjectSelect
                                currentObjectId={this.props.stage.bossId}
                                objectType="boss"
                                onChange={this.handleBossChange}
                                project={this.props.project}
                            />
                        </div>
                        <div className="row">
                            <span>Enemies:</span>
                            <ObjectSelect
                                currentObjectId={this.state.selectedNewEnemyId}
                                objectType="enemy"
                                onChange={this.handleSelectNewEnemy}
                                project={this.props.project}
                            />
                            <button
                                className="addEnemy"
                                onClick={this.handleAddEnemy}
                            >
                                + Add
                            </button>
                        </div>
                        <EnemyList
                            onSelectEnemy={this.handleSelectEnemy}
                            project={this.props.project}
                            stage={this.props.stage}
                        />
                    </div>
                    {/* stage */}
                    <div className="stagePreview">
                        <StageRenderer
                            project={this.props.project}
                            stage={this.props.stage}
                            time={this.state.timeSeconds}
                        />
                    </div>
                    {/* properties */}
                    <PropertyEdit
                        enemyIndex={this.state.selectedEnemyIndex}
                        handleUpdate={this.handleUpdateEnemy}
                        project={this.props.project}
                        stage={this.props.stage}
                    />
                </div>
                {/* timeline */}
                <div className="row timeline">
                    <input
                        type="range"
                        onChange={this.handleTimelineChange}
                        min="0"
                        max={this.props.stage.lengthSeconds.toString()}
                        step="0.01"
                        value={this.state.timeSeconds.toString()}
                    />
                </div>
            </div>
        );
    }
}
