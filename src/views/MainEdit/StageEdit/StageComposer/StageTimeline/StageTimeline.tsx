import React, { ChangeEvent } from 'react';
import './StageTimeline.scss';
import { StageModel, ProjectModel, SpriteModel, StageEnemyData, EnemyModel, BossModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import PathHelper from '../../../../../utils/PathHelper';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    frame: number;
    onScrub: (frame: number) => any;
    selectedEntityIndex: number;
    loopStart: number;
    loopEnd: number;
    loopEnabled: boolean;
    max: number;
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
                return PathHelper.resolveObjectFileName(sprite.path);
            }
        }

        return "";
    }

    render()
    {
        const s = this.props.loopStart <= this.props.loopEnd ? {
            left: (this.props.loopStart / this.props.max * 100),
            width: ((this.props.loopEnd - this.props.loopStart) / this.props.max * 100),
            color: "#9999AA"
        } : {
            left: (this.props.loopEnd / this.props.max * 100),
            width: ((this.props.loopStart - this.props.loopEnd) / this.props.max * 100),
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
                <div className="row">
                    <input
                        type="range"
                        onChange={this.handleScrub}
                        min="0"
                        max={this.props.max.toString()}
                        step={1}
                        value={this.props.frame.toString()}
                        style={style}
                    />
                    <input
                        type="number"
                        onChange={this.handleScrub}
                        min="0"
                        max={this.props.max.toString()}
                        step={1}
                        value={this.props.frame.toString()}
                    />
                </div>
            </div>
        );
    }
}
