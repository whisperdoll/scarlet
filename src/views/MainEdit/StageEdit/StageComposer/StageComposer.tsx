import React, { ChangeEvent } from 'react';
import './StageComposer.scss';
import { StageModel, ProjectModel, StageEnemyData, BossModel, BossFormModel } from '../../../../utils/datatypes';
import ObjectHelper from '../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../components/ObjectSelect/ObjectSelect";
import EnemyList from './EnemyList/EnemyList';
import PropertyEdit from './PropertyEdit/PropertyEdit';
import StageRenderer from "./StageRenderer/StageRenderer";
import { array_copy, obj_copy, array_remove_at } from '../../../../utils/utils';
import ScriptEngine from '../../../../utils/ScriptEngine';
import StageTimeline from './StageTimeline/StageTimeline';
import BossFormList from './BossFormList/BossFormList';
import BossFormEdit from '../../BossEdit/BossFormEdit/BossFormEdit';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    onUpdate: (stage: StageModel) => any;
    onProjectUpdate: (project: ProjectModel) => any;
    onBack: () => any;
}

interface State
{
    timeSeconds: number;
    selectedEnemyIndex: number;
    selectedNewEnemyId: number;
    playing: boolean;
    refreshRenderer: boolean;
    selectedEnemyAliveCount: number;
    selectedEnemyBulletAliveCount: number;
    editMode: "enemy" | "boss";
    selectedBossFormIndex: number;
}

export default class StageComposer extends React.PureComponent<Props, State>
{
    private animationFrameHandle: number | null = null;

    constructor(props: Props)
    {
        super(props);
        
        this.state = {
            timeSeconds: 0,
            selectedEnemyIndex: -1,
            selectedNewEnemyId: -1,
            playing: false,
            refreshRenderer: false,
            selectedEnemyAliveCount: 0,
            selectedEnemyBulletAliveCount: 0,
            editMode: "enemy",
            selectedBossFormIndex: 0
        };

        this.handleBack = this.handleBack.bind(this);
        this.handleLengthChange = this.handleLengthChange.bind(this);
        this.handleWidthChange = this.handleWidthChange.bind(this);
        this.handleHeightChange = this.handleHeightChange.bind(this);
        this.handleSpawnXChange = this.handleSpawnXChange.bind(this);
        this.handleSpawnYChange = this.handleSpawnYChange.bind(this);
        this.handleBossSpawnXChange = this.handleBossSpawnXChange.bind(this);
        this.handleBossSpawnYChange = this.handleBossSpawnYChange.bind(this);
        this.handleBackgroundChange = this.handleBackgroundChange.bind(this);
        this.handlePlayerChange = this.handlePlayerChange.bind(this);
        this.handleBossChange = this.handleBossChange.bind(this);
        this.handleTimeScrub = this.handleTimeScrub.bind(this);
        this.handleAddEnemy = this.handleAddEnemy.bind(this);
        this.handleSelectEnemy = this.handleSelectEnemy.bind(this);
        this.handleDeselectEnemy = this.handleDeselectEnemy.bind(this);
        this.handleRemoveEnemy = this.handleRemoveEnemy.bind(this);
        this.handleSelectNewEnemy = this.handleSelectNewEnemy.bind(this);
        this.handleAddEnemy = this.handleAddEnemy.bind(this);
        this.handleUpdateEnemy = this.handleUpdateEnemy.bind(this);
        this.refreshScripts = this.refreshScripts.bind(this);
        this.handlePlayPause = this.handlePlayPause.bind(this);
        this.animate = this.animate.bind(this);
        this.handleInstanceCount = this.handleInstanceCount.bind(this);
        this.handleBossEditMode = this.handleBossEditMode.bind(this);
        this.handleEnemyEditMode = this.handleEnemyEditMode.bind(this);
        this.handleBossFormIndexChange = this.handleBossFormIndexChange.bind(this);
        this.handleAddBossForm = this.handleAddBossForm.bind(this);
        this.handleBossFormUpdate = this.handleBossFormUpdate.bind(this);
        this.handleBossFormRemove = this.handleBossFormRemove.bind(this);
    }

    animate()
    {
        if (this.state.playing)
        {
            this.setState((state) =>
            {
                let newTime = state.timeSeconds + 1/60;
                if (newTime >= this.props.stage.lengthSeconds)
                {
                    newTime = this.props.stage.lengthSeconds - 1/60;
                }

                return {
                    ...state,
                    timeSeconds: newTime
                };
            });
        }
        this.animationFrameHandle = requestAnimationFrame(this.animate);
    }

    refreshScripts()
    {
        ScriptEngine.updateCache(this.props.project);
        this.setState((state) =>
        {
            return {
                ...state,
                refreshRenderer: !state.refreshRenderer
            };
        });
    }

    componentDidMount()
    {
        this.refreshScripts();
        this.animate();
    }

    componentWillUnmount()
    {
        if (this.animationFrameHandle !== null)
        {
            cancelAnimationFrame(this.animationFrameHandle);
            this.animationFrameHandle = null;
        }
    }

    componentDidUpdate(prevProps: Props, prevState: State)
    {
        const currentEnemies = this.props.stage.enemies;
        const prevEnemies = prevProps.stage.enemies;

        if (currentEnemies.length !== prevEnemies.length)
        {
            this.refreshScripts();
        }
        else
        {
            for (let i = 0; i < currentEnemies.length; i++)
            {
                const currObj = ObjectHelper.getObjectWithId(currentEnemies[i].id, this.props.project);
                const prevObj = ObjectHelper.getObjectWithId(prevEnemies[i].id, this.props.project);

                if (!currObj || !prevObj)
                {
                    throw new Error("somertthing bad happen,,,");
                }
                else if (currObj.type !== prevObj.type)
                {
                    this.refreshScripts();
                    break;
                }
            }
        }

        const currentBoss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        const prevBoss = ObjectHelper.getObjectWithId<BossModel>(prevProps.stage.bossId, prevProps.project);

        if (currentBoss && prevBoss)
        {
            if (currentBoss.forms.length > prevBoss.forms.length)
            {
                // form was added //
                this.handleBossFormIndexChange(currentBoss.forms.length - 1);
            }
            else if (currentBoss.forms.length < prevBoss.forms.length)
            {
                // form was removed //
                const index = prevState.selectedBossFormIndex;
                this.handleBossFormIndexChange(Math.max(0, index - 1));
            }
        }
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

    handleBossSpawnXChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.size.y;
        }

        this.props.onUpdate({
            ...this.props.stage,
            bossSpawnPosition: {
                ...this.props.stage.bossSpawnPosition,
                x: val
            }
        });
    }

    handleBossSpawnYChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.size.y;
        }

        this.props.onUpdate({
            ...this.props.stage,
            bossSpawnPosition: {
                ...this.props.stage.bossSpawnPosition,
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

    handleTimeScrub(time: number)
    {
        this.setState((state) =>
        {
            return {
                ...state,
                timeSeconds: time,
                playing: false
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
                    spawnPosition: {
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

    handleDeselectEnemy()
    {
        this.setState((state) =>
        {
            return {
                ...state,
                selectedEnemyIndex: -1
            };
        });
    }

    handleRemoveEnemy(index: number)
    {
        const enemies = array_copy(this.props.stage.enemies);
        array_remove_at(enemies, index);
        this.setState((state) =>
        {
            return {
                ...state,
                selectedEnemyIndex: -1
            };
        });
        this.props.onUpdate({
            ...this.props.stage,
            enemies: enemies
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

    handlePlayPause(e: React.MouseEvent)
    {
        if (!this.state.playing)
        {
            e.preventDefault();
            document.getElementById("renderer")?.focus();
        }
        
        this.setState((state) =>
        {
            return {
                ...state,
                playerTempPosition: obj_copy(this.props.stage.playerSpawnPosition),
                playing: !state.playing
            };
        });
    }

    handleInstanceCount(instance: number, bullet: number)
    {
        this.setState((state) =>
        {
            return {
                ...state,
                selectedEnemyAliveCount: instance,
                selectedEnemyBulletAliveCount: bullet
            };
        });
    }

    handleBossEditMode()
    {
        if (this.props.stage.bossId >= 0)
        {
            this.setState((state) =>
            {
                return {
                    ...state,
                    playing: false,
                    timeSeconds: 0,
                    editMode: "boss"
                };
            });
        }
        else
        {
            alert("select a boss first!");
        }
    }

    handleEnemyEditMode()
    {
        this.setState((state) =>
        {
            return {
                ...state,
                playing: false,
                timeSeconds: 0,
                editMode: "enemy"
            };
        });
    }

    handleBossFormIndexChange(index: number)
    {
        this.setState((state) =>
        {
            return {
                ...state,
                selectedBossFormIndex: index,
                timeSeconds: 0
            };
        });
    }

    handleAddBossForm()
    {
        const form: BossFormModel = {
            bulletId: -1,
            hp: 10,
            scriptId: -1,
            spriteId: -1,
            lifetime: 10
        };

        const boss = obj_copy(ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project));
        if (boss)
        {
            boss.forms = boss.forms.concat([form]);
            const { project } = ObjectHelper.updateObject(boss, this.props.project, []);
            this.props.onProjectUpdate(project);
        }
    }

    handleBossFormUpdate(bossForm: BossFormModel, index: number)
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (boss)
        {
            const forms = array_copy(boss.forms);
            forms[index] = bossForm;
            const newBoss: BossModel = {
                ...boss,
                forms: forms
            };

            const { project } = ObjectHelper.updateObject(newBoss, this.props.project, []);
            this.props.onProjectUpdate(project);
        }
    }

    handleBossFormRemove(index: number)
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (boss)
        {
            const forms = array_copy(boss.forms);
            array_remove_at(forms, index);
            const newBoss: BossModel = {
                ...boss,
                forms: forms
            };

            const { project } = ObjectHelper.updateObject(newBoss, this.props.project, []);
            this.props.onProjectUpdate(project);
        }
    }

    private get selectedBossForm(): BossFormModel | null
    {
        if (this.state.selectedBossFormIndex === -1)
        {
            return null;
        }

        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (!boss || boss.forms.length === 0)
        {
            return null;
        }

        return boss.forms[this.state.selectedBossFormIndex];
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
                            <span>,</span>
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
                            <span className="label">Spawn Pos:</span>
                            <input
                                type="number"
                                onChange={this.handleBossSpawnXChange}
                                value={this.props.stage.bossSpawnPosition.x.toString()}
                            />
                            <span>,</span>
                            <input
                                type="number"
                                onChange={this.handleBossSpawnYChange}
                                value={this.props.stage.bossSpawnPosition.y.toString()}
                            />
                        </div>
                        {this.state.editMode === "enemy" && (<React.Fragment>
                            <button
                                onClick={this.handleBossEditMode}
                            >
                                Boss Edit Mode
                            </button>
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
                        </React.Fragment>)}
                        {this.state.editMode === "boss" && (<React.Fragment>
                            <button
                                onClick={this.handleEnemyEditMode}
                            >
                                Enemy Edit Mode
                            </button>
                            <div className="row">
                                <span className="formsLabel">Forms:</span>
                                <button onClick={this.handleAddBossForm}>+ Add New</button>
                            </div>
                            <BossFormList
                                onSelectBossForm={this.handleBossFormIndexChange}
                                project={this.props.project}
                                stage={this.props.stage}
                                bossId={this.props.stage.bossId}
                            />
                        </React.Fragment>)}
                    </div>
                    {/* stage */}
                    <div className="stagePreview">
                        <StageRenderer
                            project={this.props.project}
                            stage={this.props.stage}
                            time={this.state.timeSeconds}
                            refresh={this.state.refreshRenderer}
                            selectedEntityIndex={this.state.editMode === "enemy" ? this.state.selectedEnemyIndex : this.state.selectedBossFormIndex}
                            onInstanceCount={this.handleInstanceCount}
                            editMode={this.state.editMode}
                            playing={this.state.playing}
                        />
                    </div>
                    {/* properties */}
                    {this.state.editMode === "enemy" && (this.state.selectedEnemyIndex >= 0) && (
                        <PropertyEdit
                            enemyIndex={this.state.selectedEnemyIndex}
                            onUpdate={this.handleUpdateEnemy}
                            project={this.props.project}
                            stage={this.props.stage}
                            onDeselectEnemy={this.handleDeselectEnemy}
                            onRequestRemoveEnemy={this.handleRemoveEnemy}
                            enemyAliveCount={this.state.selectedEnemyAliveCount}
                            enemyBulletAliveCount={this.state.selectedEnemyBulletAliveCount}
                        />
                    )}
                    {this.state.editMode === "boss" && this.selectedBossForm && (
                        <BossFormEdit
                            bossForm={this.selectedBossForm}
                            index={this.state.selectedBossFormIndex}
                            onUpdate={this.handleBossFormUpdate}
                            onRequestRemove={this.handleBossFormRemove}
                            project={this.props.project}
                        />
                    )}
                </div>
                {/* timeline */}
                <StageTimeline
                    onTimeScrub={this.handleTimeScrub}
                    project={this.props.project}
                    stage={this.props.stage}
                    time={this.state.timeSeconds}
                    selectedEntityIndex={this.state.editMode === "enemy" ? this.state.selectedEnemyIndex : this.state.selectedBossFormIndex}
                    editMode={this.state.editMode}
                />
                <button
                    className="play"
                    onClick={this.handlePlayPause}
                >
                    {this.state.playing ? "Pause" : "Play"}
                </button>
            </div>
        );
    }
}
