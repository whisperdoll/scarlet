import React, { ChangeEvent } from 'react';
import './StageTimeline.scss';
import { StageModel, ProjectModel, SpriteModel, StageEnemyData, EnemyModel, BossModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    frame: number;
    onScrub: (frame: number) => any;
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

    handleScrub = (e: ChangeEvent<HTMLInputElement>) =>
    {
        const frame = parseInt(e.currentTarget.value);
        if (!isNaN(frame))
        {
            this.props.onScrub(frame);
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

    private get formLength(): number
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        return boss?.forms[this.props.selectedEntityIndex]?.lifetime || 0;
    }

    private get length(): number
    {
        return (this.props.editMode === "enemy" ? this.props.stage.length : this.formLength) - 1;
    }

    render()
    {
        const s = this.props.loopStart <= this.props.loopEnd ? {
            left: (this.props.loopStart / this.length * 100),
            width: ((this.props.loopEnd - this.props.loopStart) / this.length * 100),
            color: "#9999AA"
        } : {
            left: (this.props.loopEnd / this.length * 100),
            width: ((this.props.loopStart - this.props.loopEnd) / this.length * 100),
            color: "#AA5555"
        };

        const style = this.props.loopEnabled ? {
            backgroundImage: `linear-gradient(
                to right,
                transparent,
                transparent ${s.left}%,
                ${s.color} ${s.left}%,
                ${s.color} ${s.left + s.width}%,
                transparent ${s.left + s.width}%
            )`
        } : {};

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
                                        left: (enemy.spawnFrame / this.props.stage.length * 100).toString() + "%",
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
                <div className="row">
                    <input
                        type="range"
                        onChange={this.handleScrub}
                        min="0"
                        max={this.length.toString()}
                        step={1}
                        value={this.props.frame.toString()}
                        style={style}
                    />
                    <input
                        type="number"
                        onChange={this.handleScrub}
                        min="0"
                        max={this.length.toString()}
                        step={1}
                        value={this.props.frame.toString()}
                    />
                </div>
            </div>
        );
    }
}
