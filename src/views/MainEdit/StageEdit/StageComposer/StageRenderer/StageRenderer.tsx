import React, { ChangeEvent, Ref } from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, PlayerModel, SpriteModel, ObjectModel, EnemyModel } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import ScriptEngine, { EnemyScriptContext, EnemyScriptMethodCollection, EnemyScriptResult, ScriptResult } from '../../../../../utils/ScriptEngine';
import { obj_copy } from '../../../../../utils/utils';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    time: number;
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
            ImageCache.getImage(sprite.path, (img) =>
            {
                this.canvas?.drawImage(img, pos.minus(Point.fromSizeLike(img).dividedBy(2)));
            });
        }
    }

    renderStage()
    {
        if (!this.canvas || !this.dirty)
        {
            requestAnimationFrame(this.renderStage);
            return;
        }

        // console.time("> stage render");

        this.dirty = false;
        // console.time("clear canvas");
        this.canvas.clear();
        // console.timeEnd("clear canvas");

        // console.time("fetch background");
        const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.props.stage.backgroundId, this.props.project);
        // console.timeEnd("fetch background");
        if (background)
        {
            ImageCache.getImage(background.path, (img) =>
            {
                this.canvas?.drawImage(img, new Rectangle(new Point(0), this.canvas.size));
            });
        }

        // console.time("fetch player");
        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        // console.timeEnd("fetch player");
        // console.time("draw player");
        player && this.renderSpriteHaver(player, Point.fromPointLike(this.props.stage.playerSpawnPosition));
        // console.timeEnd("draw player");

        // console.time("enemies");
        this.props.stage.enemies.forEach((enemyData, enemyIndex) =>
        {
            for (let i = 0; i < enemyData.spawnAmount; i++)
            {
                const minTime = enemyData.spawnTime + (1 / enemyData.spawnRate) * i;
                const maxTime = minTime + enemyData.lifetime;

                if (minTime <= this.props.time && this.props.time < maxTime)
                {
                    // console.time("retrieve enemy");
                    const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, this.props.project);
                    // console.timeEnd("retrieve enemy");
                    const gameSize = obj_copy(this.props.stage.size);
                    if (enemy)
                    {
                        if (enemy.scriptId >= 0)
                        {
                            try
                            {
                                // console.time("parse script");
                                const methods = ScriptEngine.parseScriptFor<EnemyScriptContext, EnemyScriptResult>(enemy, this.props.project);
                                // console.timeEnd("parse script");
                                let scriptInfo = {
                                    position: obj_copy(enemyData.position)
                                };
                                // console.time("catchup loop");
                                for (let _time = minTime; _time < this.props.time; _time += 1 / 60)
                                {
                                    // console.time("method call");
                                    const results = methods.update({
                                        age: this.props.time - minTime,
                                        game: { 
                                            size: gameSize
                                        },
                                        index: i,
                                        spawnPosition: enemyData.position,
                                        stageAge: this.props.time,
                                        delta: 1 / 60,
                                        position: scriptInfo.position,
                                        _uniq: ""
                                    });
                                    // console.timeEnd("method call");
                                    
                                    // console.time("eat results");
                                    if (results)
                                    {
                                        if (results.position) scriptInfo.position = results.position;
                                    }
                                    // console.timeEnd("eat results");
                                }
                                // console.timeEnd("catchup loop");
                                // console.time("render sprite");
                                this.renderSpriteHaver(enemy, Point.fromPointLike(scriptInfo.position));
                                // console.timeEnd("render sprite");
                            }
                            catch (e)
                            {
                                console.error(e);
                            }
                            
                        }
                        else
                        {
                            this.renderSpriteHaver(enemy, Point.fromPointLike(enemyData.position));
                        }
                    } 
                }
            }
        });
        // console.timeEnd("enemies");

        requestAnimationFrame(this.renderStage);
        // console.timeEnd("> stage render");
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
