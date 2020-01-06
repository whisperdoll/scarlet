import React, { ChangeEvent } from 'react';
import './StageTimeline.scss';
import { StageModel, SpriteModel, StageEnemyData, EnemyModel, BossModel, BossFormModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import AnimatedSpriteCanvas from '../../../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';
import GameEngine from '../../../../../utils/GameEngine';

interface Props
{
    stage: StageModel;
    frame: number;
    onScrub: (frame: number) => any;
    currentSelectionType: "none" | "enemy" | "bossForm" | "object";
    currentSelectionId: number;
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

    private spriteForEnemy = (enemyData: StageEnemyData): SpriteModel | null =>
    {
        const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id);
        return enemy && this.getSprite(enemy.spriteId);
    }

    private spriteForBossForm = (bossForm: BossFormModel): SpriteModel | null =>
    {
        return this.getSprite(bossForm.spriteId);
    }

    private getSprite = (spriteId: number): SpriteModel | null =>
    {
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(spriteId);
        return sprite;
    }

    private getBossForms = (): (BossFormModel & { spawnFrame: number })[] =>
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId);
        if (boss)
        {
            let spawnFrame = this.props.stage.length;
            const ret: (BossFormModel & { spawnFrame: number })[] = [];
            
            boss.formIds.forEach((formId) =>
            {
                const form = ObjectHelper.getObjectWithId<BossFormModel>(formId);
                if (form)
                {
                    ret.push({
                        ...form,
                        spawnFrame: spawnFrame
                    });
    
                    spawnFrame += form.lifetime + GameEngine.bossTransitionFrames;
                }
            });

            return ret;
        }

        return [];
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
                <div className="row">
                    <div className="enemyTimeline">
                        {this.props.max && (<React.Fragment>
                            {this.props.stage.enemies.map((enemy, i) =>
                            {
                                return this.spriteForEnemy(enemy) ? (
                                    <AnimatedSpriteCanvas
                                        canvasOptions={{
                                            opaque: false,
                                            pixelated: true
                                        }}
                                        sprite={this.spriteForEnemy(enemy)!}
                                        className={this.props.currentSelectionType === "enemy" && i === this.props.currentSelectionId ? "selected" : ""}
                                        style={{
                                            position: "absolute",
                                            left: (enemy.spawnFrame / this.props.max * 100).toString() + "%",
                                            transform: "translate(-50%, 0)",
                                            height: "32px"
                                        }}
                                        key={i}
                                    />
                                ) : null;
                            })}
                            {this.getBossForms().map((bossForm, i) => 
                            {
                                return this.spriteForBossForm(bossForm) ? (
                                    <AnimatedSpriteCanvas
                                        canvasOptions={{
                                            opaque: false,
                                            pixelated: true
                                        }}
                                        sprite={this.spriteForBossForm(bossForm)!}
                                        className={this.props.currentSelectionType === "bossForm" && this.props.currentSelectionId === bossForm.id ? "selected" : ""}
                                        style={{
                                            position: "absolute",
                                            left: (bossForm.spawnFrame / this.props.max * 100).toString() + "%",
                                            transform: "translate(-50%, 0)",
                                            height: "32px"
                                        }}
                                        key={i}
                                    />
                                ) : null;
                            })}
                        </React.Fragment>)}
                    </div>
                    <input
                        type="number"
                        style={{
                            opacity: 0,
                            touchAction: "none",
                            cursor: "default"
                        }}
                    />
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
