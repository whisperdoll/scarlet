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
import ImageCache from '../../../../utils/ImageCache';
import GameEngine from '../../../../utils/GameEngine';
import update from "immutability-helper";

type PauseAction = "loopAndPause" | "pause";
type DeathAction = "loopAndPause" | "pause" | "loop";

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
    frame: number;
    selectedEnemyIndex: number;
    selectedBossFormIndex: number;
    selectedNewEnemyId: number;
    playing: boolean;
    refreshRenderer: boolean;
    selectedEnemyAliveCount: number;
    selectedEnemyBulletAliveCount: number;
    loopStart: number;
    loopEnd: number;
    loopEnabled: boolean;
    deathAction: DeathAction;
    pauseAction: PauseAction;
    playerInvincible: boolean;
    finalFrame: number;
}

export default class StageComposer extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        
        this.state = {
            frame: 0,
            selectedEnemyIndex: -1,
            selectedNewEnemyId: -1,
            playing: false,
            refreshRenderer: false,
            selectedEnemyAliveCount: 0,
            selectedEnemyBulletAliveCount: 0,
            selectedBossFormIndex: 0,
            loopStart: 0,
            loopEnd: props.stage.length - 1,
            loopEnabled: false,
            deathAction: "loopAndPause",
            pauseAction: "loopAndPause",
            playerInvincible: true,
            finalFrame: 0
        };

        ScriptEngine.updateCache(this.props.project);
        ImageCache.updateCache(this.props.project);
    }

    refreshScripts = () =>
    {
        ScriptEngine.updateCache(this.props.project);
        if (this.state.playing)
        {
            this.pause();
        }
        this.setState(state => ({
            ...state,
            refreshRenderer: !state.refreshRenderer
        }));
    }

    refreshImages = () =>
    {
        ImageCache.updateCache(this.props.project);
        this.setState(state => ({
            ...state,
            refreshRenderer: !state.refreshRenderer
        }));
    }

    componentDidMount = () =>
    {
    }

    componentWillUnmount = () =>
    {
    }

    componentDidUpdate = (prevProps: Props, prevState: State) =>
    {
        // script refreshing //
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
                const prevObj = ObjectHelper.getObjectWithId(prevEnemies[i].id, prevProps.project);

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

        // boss stuff //
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

    handleBack = () =>
    {
        this.props.onBack();
    }

    handleLengthChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.props.stage.length;
        }

        this.props.onUpdate({
            ...this.props.stage,
            length: Math.max(1, val)
        });
    }

    handleWidthChange = (e: ChangeEvent<HTMLInputElement>) =>
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
                x: Math.max(1, val)
            }
        });
    }

    handleHeightChange = (e: ChangeEvent<HTMLInputElement>) =>
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
                y: Math.max(1, val)
            }
        });
    }

    handleSpawnXChange = (e: ChangeEvent<HTMLInputElement>) =>
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

    handleSpawnYChange = (e: ChangeEvent<HTMLInputElement>) =>
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

    handleBossSpawnXChange = (e: ChangeEvent<HTMLInputElement>) =>
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

    handleBossSpawnYChange = (e: ChangeEvent<HTMLInputElement>) =>
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

    handleLoopStartChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        const val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            return;
        }
        
        this.setState(state => ({
            ...state,
            loopStart: Math.max(0, Math.min(state.finalFrame, val))
        }));
    }

    handleLoopEndChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        const val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            return;
        }
        
        this.setState(state => ({
            ...state,
            loopEnd: Math.max(0, Math.min(state.finalFrame, val))
        }));
    }

    handleBackgroundChange = (backgroundId: number) =>
    {
        this.props.onUpdate({
            ...this.props.stage,
            backgroundId: backgroundId
        });
    }

    handlePlayerChange = (playerId: number) =>
    {
        this.props.onUpdate({
            ...this.props.stage,
            playerId: playerId
        });
    }

    handleBossChange = (bossId: number) =>
    {
        this.props.onUpdate({
            ...this.props.stage,
            bossId: bossId
        });
    }

    handleFrameScrub = (frame: number) =>
    {
        this.setState(state => ({
            ...state,
            frame: Math.max(0, Math.min(state.finalFrame, frame)),
            playing: false
        }));
    }

    handleAddEnemy = () =>
    {
        if (this.state.selectedNewEnemyId >= 0)
        {
            this.props.onUpdate(update(this.props.stage, {
                enemies: {
                    $push: [{
                        id: this.state.selectedNewEnemyId,
                        instanceName: "New Enemy " + this.props.stage.enemies.length.toString(),
                        spawnPosition: {
                            x: 0,
                            y: 0
                        },
                        spawnAmount: 1,
                        spawnRate: 0,
                        spawnFrame: this.state.frame
                    }]
                }
            }));
        }
    }

    handleSelectEnemy = (index: number) =>
    {
        this.setState(state => ({
            ...state,
            selectedEnemyIndex: index,
            selectedBossFormIndex: -1
        }));
    }

    handleDeselectEnemy = () =>
    {
        this.setState(state => ({
            ...state,
            selectedEnemyIndex: -1
        }));
    }

    handleRemoveEnemy = (index: number) =>
    {
        const enemies = array_copy(this.props.stage.enemies);
        array_remove_at(enemies, index);
        this.setState(state => ({
            ...state,
            selectedEnemyIndex: -1
        }));
        this.props.onUpdate({
            ...this.props.stage,
            enemies: enemies
        });
    }

    handleSelectNewEnemy = (newEnemyId: number) =>
    {
        this.setState(state =>
        {
            return {
                ...state,
                selectedNewEnemyId: newEnemyId
            };
        });
    }

    handleUpdateEnemy = (enemy: StageEnemyData, index: number) =>
    {
        const enemies = array_copy(this.props.stage.enemies);
        enemies[index] = enemy;

        this.props.onUpdate({
            ...this.props.stage,
            enemies: enemies
        });
    }

    pause()
    {
        let frame: number = this.state.frame;
        
        if (this.state.loopEnabled)
        {
            switch (this.state.pauseAction)
            {
                case "loopAndPause":
                    frame = this.state.loopStart;
                    break;
                case "pause":
                    frame = this.state.frame;
                    break;
            }
        }
        
        this.setState(state => ({
            ...state,
            playerTempPosition: obj_copy(this.props.stage.playerSpawnPosition),
            playing: false,
            frame: frame
        }));
    }

    play()
    {
        this.setState(state => ({
            playing: true,
            frame: (state.loopEnabled && state.frame === state.loopEnd && state.loopEnd > state.loopStart) ? state.loopStart : state.frame
        }));
    }

    handlePlayPause = (e: React.MouseEvent) =>
    {        
        if (this.state.playing)
        {
            this.pause();
        }
        else
        {
            e && e.preventDefault();
            document.getElementById("renderer")?.focus();
            this.play();
        }
    }

    handleInstanceCount = (instance: number, bullet: number) =>
    {
        this.setState(state => ({
            ...state,
            selectedEnemyAliveCount: instance,
            selectedEnemyBulletAliveCount: bullet
        }));
    }

    handleBossFormIndexChange = (index: number) =>
    {
        if (index >= 0)
        {
            this.setState(state => ({
                ...state,
                selectedBossFormIndex: index,
                selectedEnemyIndex: -1
            }));
        }
    }

    handleAddBossForm = () =>
    {
        const form: BossFormModel = {
            bulletId: -1,
            hp: 10,
            scriptId: -1,
            spriteId: -1,
            lifetime: 10 * 60
        };

        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (boss)
        {
            const newBoss = update(boss, {
                forms: {
                    $push: [ form ]
                }
            });
            
            const { project } = ObjectHelper.updateObject(newBoss, this.props.project, []);
            this.props.onProjectUpdate(project);
        }
    }

    handleBossFormUpdate = (bossForm: BossFormModel, index: number) =>
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (boss)
        {
            const newBoss = update(boss, {
                forms: {
                    [index]: {
                        $set: bossForm
                    }
                }
            });

            const { project } = ObjectHelper.updateObject(newBoss, this.props.project, []);
            this.props.onProjectUpdate(project);
        }
    }

    handleBossFormRemove = (index: number) =>
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (boss)
        {
            const newBoss = update(boss, {
                forms: {
                    $splice: [[index, 1]]
                }
            });

            const { project } = ObjectHelper.updateObject(newBoss, this.props.project, []);
            this.props.onProjectUpdate(project);

            if (newBoss.forms.length === 0)
            {
                this.setState(state => ({
                    ...state,
                    editMode: "enemy"
                }));
            }
        }
    }

    handleLoopStartSyncToggle = (toggled: boolean) =>
    {
        this.setState(state => ({
            ...state,
            loopStartSync: toggled,
            loopStart: toggled ? this.state.frame : this.state.loopStart
        }));
    }

    handlePauseActionChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    {
        const action = e.currentTarget.value as PauseAction;
        this.setState(state => ({
            ...state,
            pauseAction: action
        }));
    }

    handleDeathActionChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    {
        const action = e.currentTarget.value as DeathAction;
        this.setState(state => ({
            ...state,
            deathAction: action
        }));
    }

    gotoLoopStart = () =>
    {
        this.setState(state => ({
            ...state,
            frame: this.state.loopStart
        }));
    }

    syncLoopStart = () =>
    {
        this.setState(state => ({
            ...state,
            loopStart: this.state.frame
        }));
    }

    syncLoopEnd = () =>
    {
        this.setState(state => ({
            ...state,
            loopEnd: this.state.frame,
            frame: (state.playing && state.frame > state.loopStart) ? state.loopStart : state.frame
        }));
    }

    handlePlayerDie = () =>
    {
        if (this.state.playing)
        {
            let frame: number = this.state.frame;
            let playing: boolean = this.state.playing;

            if (this.state.loopEnabled)
            {
                switch (this.state.deathAction)
                {
                    case "loop":
                        frame = this.state.loopStart;
                        break;
                    case "loopAndPause":
                        frame = this.state.loopStart;
                        playing = false;
                        break;
                    case "pause":
                        playing = false;
                        break;
                }
            }
            else
            {
                playing = false;
            }

            this.setState(state => ({
                ...state,
                frame: frame,
                playing: playing
            }));
        }
    }

    toggleLoopEnabled = () =>
    {
        this.setState(state => ({
            ...state,
            loopEnabled: !state.loopEnabled
        }));
    }

    handlePlayFrame = (frame: number, isLastFrame: boolean) =>
    {
        this.setState(_state => {
            const state = obj_copy(_state) as State;
            state.frame = frame;

            if (state.loopEnabled && state.frame === state.loopEnd && state.loopEnd > state.loopStart)
            {
                state.frame = state.loopStart;
            }
            else if (isLastFrame)
            {
                state.playing = false;
            }

            return state;
        });
    }

    handlePlayerInvincibleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const checked = e.currentTarget.checked;
        this.setState(state => ({
            ...state,
            playerInvincible: checked
        }));
    }

    handleFinalFrameCalculate = (finalFrame: number) =>
    {
        this.setState(state => ({
            ...state,
            finalFrame: finalFrame
        }));
    }

    private get selectedBossForm(): BossFormModel | null
    {
        return this.getBossForm(this.state.selectedBossFormIndex);
    }

    private getBossForm = (index: number): BossFormModel | null =>
    {
        if (index === -1) return null;

        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (!boss || boss.forms.length === 0)
        {
            return null;
        }

        return boss.forms[index];
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
                    <button
                        className="refreshImage"
                        onClick={this.refreshImages}
                    >
                        Refresh Images
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
                                value={this.props.stage.length.toString()}
                            />
                            <span>frames</span>
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
                        {this.state.loopEnabled && (<React.Fragment>
                            <div className="row">
                                <span className="label">Loop Start:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max={this.state.loopEnd - 1}
                                    onChange={this.handleLoopStartChange}
                                    value={this.state.loopStart}
                                />
                                <button onClick={this.gotoLoopStart}>Goto</button>
                                <button onClick={this.syncLoopStart}>Sync</button>
                            </div>
                            <div className="row">
                                <span className="label">Loop End:</span>
                                <input
                                    type="number"
                                    min={this.state.loopStart + 1}
                                    max={this.props.stage.length - 1}
                                    onChange={this.handleLoopEndChange}
                                    value={this.state.loopEnd}
                                />
                                <button onClick={this.syncLoopEnd}>Sync</button>
                            </div>
                            <div className="row">
                                <span className="label">On Pause:</span>
                                <select
                                    onChange={this.handlePauseActionChange}
                                    value={this.state.pauseAction}
                                >
                                    <option value="loopAndPause">Return to loop start</option>
                                    <option value="pause">Pause in place</option>
                                </select>
                            </div>
                            <div className="row">
                                <span className="label">On Death:</span>
                                <select
                                    onChange={this.handleDeathActionChange}
                                    value={this.state.deathAction}
                                >
                                    <option value="loopAndPause">Restart loop and pause</option>
                                    <option value="pause">Pause in place</option>
                                    <option value="loop">Restart loop (no pause)</option>
                                </select>
                            </div>
                        </React.Fragment>)}
                        <button onClick={this.toggleLoopEnabled}>{this.state.loopEnabled ? "Disable" : "Enable"} Loop Points</button>
                        <label>
                            <input
                                type="checkbox"
                                checked={this.state.playerInvincible}
                                onChange={this.handlePlayerInvincibleChange}
                                name="playerInvincible"
                            />
                            Player Invincible During Play
                        </label>
                    </div>
                    {/* stage */}
                    <div className="stagePreview">
                        <StageRenderer
                            project={this.props.project}
                            stage={this.props.stage}
                            frame={this.state.frame}
                            refresh={this.state.refreshRenderer}
                            selectedEntityIndex={this.state.selectedEnemyIndex >= 0 ? this.state.selectedEnemyIndex : (this.state.selectedBossFormIndex >= 0 ? this.state.selectedBossFormIndex : -1)}
                            onInstanceCount={this.handleInstanceCount}
                            playing={this.state.playing}
                            onPlayerDie={this.handlePlayerDie}
                            onPlayFrame={this.handlePlayFrame}
                            playerInvincible={this.state.playerInvincible}
                            onUpdateStage={this.props.onUpdate}
                            onSelectEnemy={this.handleSelectEnemy}
                            onFinalFrameCalculate={this.handleFinalFrameCalculate}
                        />
                    </div>
                    {/* properties */}
                    {this.state.selectedEnemyIndex >= 0 && (
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
                    {this.selectedBossForm && (
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
                    onScrub={this.handleFrameScrub}
                    project={this.props.project}
                    stage={this.props.stage}
                    frame={this.state.frame}
                    selectedEntityIndex={this.state.selectedEnemyIndex >= 0 ? this.state.selectedEnemyIndex : (this.state.selectedBossFormIndex >= 0 ? this.state.selectedBossFormIndex : -1)}
                    loopStart={this.state.loopStart}
                    loopEnd={this.state.loopEnd}
                    loopEnabled={this.state.loopEnabled}
                    max={this.state.finalFrame}
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
