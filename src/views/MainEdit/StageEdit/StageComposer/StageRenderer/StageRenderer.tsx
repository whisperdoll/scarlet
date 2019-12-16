import React, { ChangeEvent, Ref } from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, PlayerModel, SpriteModel, ObjectModel, EnemyModel, BulletModel, ScriptModel, StageEnemyData } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import ScriptEngine, { EnemyScriptContext, EnemyScriptMethodCollection, EnemyScriptResult, ScriptResult, ScriptMethodCollection, BulletScriptMethodCollection, BulletScriptContext, BulletScriptResult } from '../../../../../utils/ScriptEngine';
import { obj_copy, numberArray } from '../../../../../utils/utils';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    time: number;
    refresh: boolean;
    selectedEnemyIndex: number;
}

interface State
{
}

export default class StageRenderer extends React.PureComponent<Props, State>
{
    private canvas: Canvas | null = null;
    private containerRef: React.RefObject<HTMLDivElement>;
    private counter: number = 0;
    private date: number = 0;
    private dirty: boolean = true;
    private rendering: boolean = false;
    private renderBuffer: boolean = false;
    private ratio: number = 1;

    constructor(props: Props)
    {
        super(props);

        this.grabCanvas = this.grabCanvas.bind(this);
        this.renderStage = this.renderStage.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);

        window.addEventListener("resize", this.handleResize);

        this.containerRef = React.createRef();
    }

    componentDidUpdate()
    {
        this.handleResize();
    }

    handleResize()
    {
        if (this.containerRef.current)
        {
            const containerSize = Point.fromSizeLike(this.containerRef.current.getBoundingClientRect());
            const stageSize = Point.fromPointLike(this.props.stage.size);
            const ratio = containerSize.dividedBy(stageSize).min;
            this.canvas?.scale(ratio, "translate(-50%,-50%)", "");
            this.ratio = ratio;
            this.dirty = true;
        }
    }

    componentDidMount()
    {
        this.handleResize();
        requestAnimationFrame(this.renderStage);
    }

    grabCanvas(canvas: Canvas)
    {
        this.canvas = canvas;
        this.canvas.addEventListener("mousedown", (pos) =>
        {
        });
    }

    renderSpriteHaver(obj: ObjectModel & { spriteId: number }, pos: Point)
    {
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(obj.spriteId, this.props.project);
        if (sprite)
        {
            ImageCache.getImage(sprite.path, (img, wasCached) =>
            {
                this.canvas?.drawImage(img, pos.minus(Point.fromSizeLike(img).dividedBy(2)));
                if (this.props.selectedEnemyIndex >= 0 && obj.id === this.props.stage.enemies[this.props.selectedEnemyIndex].id)
                {
                    this.canvas?.drawRect(new Rectangle(pos.minus(Point.fromSizeLike(img).dividedBy(2)), Point.fromSizeLike(img)), "red", 1 / this.ratio, false);
                }
                this.dirty = !wasCached; // draw order likely fucked up so let's
            });
        }
    }

    renderStage()
    {
        if (!this.canvas || !this.dirty || this.rendering)
        {
            requestAnimationFrame(this.renderStage);
            return;
        }

        console.time("> stage render");
        this.rendering = true;
        this.dirty = false;
        // console.time("clear canvas");
        this.canvas.clear();
        // console.timeEnd("clear canvas");

        // console.time("fetch background");
        const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.props.stage.backgroundId, this.props.project);
        // console.timeEnd("fetch background");
        if (background)
        {
            ImageCache.getImage(background.path, (img, wasCached) =>
            {
                this.canvas?.drawImage(img, new Rectangle(new Point(0), this.canvas.size));
                this.dirty = !wasCached;
            });
        }

        // console.time("fetch player");
        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        // console.timeEnd("fetch player");
        // console.time("draw player");
        player && this.renderSpriteHaver(player, Point.fromPointLike(this.props.stage.playerSpawnPosition));
        // console.timeEnd("draw player");

        const delta = 1 / 60;
        const gameSize = obj_copy(this.props.stage.size);
        
        // console.time("enemies");
        this.props.stage.enemies.forEach((_enemyData, enemyIndex) =>
        {
            const enemyData: StageEnemyData = obj_copy(_enemyData);
            const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, this.props.project);
            if (!enemy) return;
            if (enemy.scriptId < 0)
            {
                this.renderSpriteHaver(enemy, Point.fromPointLike(enemyData.position));
                return;
            }
            const enemyMethods = ScriptEngine.parseScriptFor<EnemyScriptContext, EnemyScriptResult>(enemy, this.props.project);

            let bulletMethods: ScriptMethodCollection<BulletScriptContext, BulletScriptResult> | null = null;
            let enemyBullet = ObjectHelper.getObjectWithId<BulletModel>(enemy.bulletId, this.props.project);
            if (enemyBullet)
            {
                bulletMethods = ScriptEngine.parseScriptFor(enemyBullet, this.props.project);
            }

            const bullets: {
                index: number,
                spawnTime: number,
                spawnPosition: {
                    x: number,
                    y: number
                }
            }[] = [];
            
            for (let i = 0; i < enemyData.spawnAmount; i++)
            {
                let bulletIndexCounter = 0;
                const minTime = enemyData.spawnTime + (1 / enemyData.spawnRate) * i;
                const maxTime = minTime + enemyData.lifetime;

                if (minTime <= this.props.time)
                {
                    let isDead = this.props.time >= maxTime;
                    let scriptInfo = {
                        position: enemyData.position
                    };
                    // console.time("catchup loop");
                    for (let _time = minTime; _time < this.props.time && _time < maxTime; _time += delta)
                    {
                        // console.time("method call");
                        const results = enemyMethods.update({
                            enemy: {
                                age: _time - minTime,
                                position: scriptInfo.position,
                                spawnPosition: enemyData.position
                            },
                            stage: {
                                age: _time,
                                size: gameSize
                            },
                            index: i,
                            delta: delta
                        });
                        // console.timeEnd("method call");
                        
                        // console.time("eat results");
                        if (results)
                        {
                            if (!results.alive)
                            {
                                isDead = true;
                                break;
                            }
                            if (results.position)
                            {
                                scriptInfo.position = results.position;
                            }
                            if (results.fire)
                            {
                                bullets.push({
                                    index: bulletIndexCounter++,
                                    spawnPosition: scriptInfo.position,
                                    spawnTime: _time
                                });
                            }
                        }
                        // console.timeEnd("eat results");
                    }
                    // console.timeEnd("catchup loop");
                    // console.time("render sprite");
                    if (!isDead)
                    {
                        this.renderSpriteHaver(enemy, Point.fromPointLike(scriptInfo.position));
                    }
                    // console.timeEnd("render sprite");
                    
                }
            }

            if (enemyBullet)
            {
                const maxTime = this.props.stage.lengthSeconds;
                bullets.forEach((bullet) =>
                {
                    bulletMethods = bulletMethods as BulletScriptMethodCollection;
                    const age = this.props.time - bullet.spawnTime;
                    if (age > maxTime)
                    {
                        return; // TODO: SHOW ERROR
                    }

                    let scriptInfo = {
                        position: bullet.spawnPosition
                    };

                    let alive = true;

                    for (let _time = bullet.spawnTime; _time < bullet.spawnTime + age; _time += delta)
                    {
                        const results = bulletMethods.update({
                            bullet: {
                                age: _time - bullet.spawnTime,
                                position: scriptInfo.position,
                                spawnPosition: bullet.spawnPosition
                            },
                            stage: {
                                age: _time,
                                size: gameSize
                            },
                            delta: delta,
                            index: bullet.index
                        });

                        if (results)
                        {
                            if (!results.alive)
                            {
                                alive = false;
                                break;
                            }
                            if (results.position) scriptInfo.position = results.position;
                        }
                    }

                    if (alive)
                    {
                        this.renderSpriteHaver(enemyBullet as BulletModel, Point.fromPointLike(scriptInfo.position));
                    }
                });
            }
        });
        // console.timeEnd("enemies");
        this.rendering = false;
        requestAnimationFrame(this.renderStage);
        console.timeEnd("> stage render");
    }

    handleUpdate()
    {
        this.dirty = true;
    }
    
    render()
    {
        return (
            <div className="stageRenderer" ref={this.containerRef}>
                <PureCanvas
                    canvasGrabber={this.grabCanvas}
                    canvasOptions={{
                        align: {
                            horizontal: true,
                            vertical: true
                        },
                        deepCalc: true,
                        opaque: true,
                        pixelated: true
                    }}
                    size={Point.fromPointLike(this.props.stage.size)}
                    onUpdate={this.handleUpdate}
                />
            </div>
        );
    }
}
