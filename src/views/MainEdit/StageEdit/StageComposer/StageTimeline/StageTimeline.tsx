import React, { ChangeEvent } from 'react';
import './StageTimeline.scss';
import { StageModel, ProjectModel, SpriteModel, StageEnemyData, EnemyModel, BossModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    time: number;
    onTimeScrub: (time: number) => any;
    selectedEntityIndex: number;
    editMode: "enemy" | "boss";
    loopStart: number;
    loopEnd: number;
    loopEnabled: boolean;
}

interface State
{
}

export default class StageTimeline extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    handleTimeScrub = (e: ChangeEvent<HTMLInputElement>) =>
    {
        const timeSeconds = parseFloat(e.currentTarget.value);
        if (!isNaN(timeSeconds))
        {
            this.props.onTimeScrub(timeSeconds);
        }
    }

    private spritePathForEnemy = (enemyData: StageEnemyData) =>
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

    private spritePathForForm = (formIndex: number): string =>
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (!boss) return "";
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(boss.forms[formIndex].spriteId, this.props.project);
        if (!sprite) return "";
        return sprite.path;
    }

    private formSpawnTime = (formIndex: number): number =>
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (boss)
        {
            let ret = 0;
            for (let i = 0; i < formIndex; i++)
            {
                ret += boss.forms[i].lifetime;
            }

            return ret;
        }

        return 0;
    }

    private get formLength(): number
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        return boss?.forms[this.props.selectedEntityIndex]?.lifetime || 0;
    }

    private get length(): number
    {
        return this.props.editMode === "enemy" ? this.props.stage.lengthSeconds : this.formLength;
    }

    render()
    {
        return (
            <div className="timeline">
                {this.props.editMode === "enemy" && (
                    <div className="enemyTimeline">
                        {this.props.stage.enemies.map((enemy, i) =>
                        {
                            return this.spritePathForEnemy(enemy) ? (
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
                                    className={i === this.props.selectedEntityIndex ? "selected" : ""}
                                    alt="sprite"
                                />
                            ) : null;
                        })}
                    </div>
                )}
                {this.props.loopEnabled && (
                    <div
                        className={this.props.loopStart <= this.props.loopEnd ? "timelineLoop" : "timelineLoop error"}
                        style={this.props.loopStart <= this.props.loopEnd ? {
                            left: (this.props.loopStart / this.length * 100).toString() + "%",
                            width: ((this.props.loopEnd - this.props.loopStart) / this.length * 100).toString() + "%"
                        } : {
                            left: (this.props.loopEnd / this.length * 100).toString() + "%",
                            width: ((this.props.loopStart - this.props.loopEnd) / this.length * 100).toString() + "%"
                        }}
                    />
                )}
                <input
                    type="range"
                    onChange={this.handleTimeScrub}
                    min="0"
                    max={this.length.toString()}
                    step="0.01"
                    value={this.props.time.toString()}
                />
            </div>
        );
    }
}
