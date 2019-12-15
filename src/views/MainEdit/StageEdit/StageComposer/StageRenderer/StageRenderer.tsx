import React, { ChangeEvent, Ref } from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, PlayerModel, SpriteModel, ObjectModel, EnemyModel } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import ScriptEngine, { EnemyScriptContext, EnemyScriptMethodCollection, EnemyScriptResult } from '../../../../../utils/ScriptEngine';
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

    constructor(props: Props)
    {
        super(props);

        this.grabCanvas = this.grabCanvas.bind(this);
        this.renderStage = this.renderStage.bind(this);
        this.handleResize = this.handleResize.bind(this);

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
        if (!this.canvas)
        {
            requestAnimationFrame(this.renderStage);
            return;
        }
        
        this.canvas.fill("#" + (Math.random() * (0xFFFFFF)).toString(16));

        const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.props.stage.backgroundId, this.props.project);
        if (background)
        {
            ImageCache.getImage(background.path, (img) =>
            {
                this.canvas?.drawImage(img, new Rectangle(new Point(0), this.canvas.size));
            });
        }

        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        player && this.renderSpriteHaver(player, Point.fromPointLike(this.props.stage.playerSpawnPosition));

        this.props.stage.enemies.forEach((enemyData) =>
        {
            for (let i = 0; i < enemyData.spawnAmount; i++)
            {
                const minTime = enemyData.spawnTime + (1 / enemyData.spawnRate) * i;
                const maxTime = minTime + enemyData.lifetime;

                if (minTime <= this.props.time && this.props.time < maxTime)
                {
                    const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, this.props.project);
                    if (enemy)
                    {
                        if (enemy.scriptId >= 0)
                        {
                            const methods = ScriptEngine.parseScriptFor<EnemyScriptMethodCollection>(enemy, this.props.project);
                            try
                            {
                                const results = methods.update({
                                    age: this.props.time - minTime,
                                    game: { 
                                        size: obj_copy(this.props.stage.size)
                                    },
                                    index: i,
                                    spawnPosition: enemyData.position,
                                    stageAge: this.props.time
                                } as EnemyScriptContext);
                                if (results && results.position)
                                {
                                    this.renderSpriteHaver(enemy, Point.fromPointLike(results.position || enemyData.position));
                                }
                                else
                                {
                                    console.log(methods, results);
                                    this.renderSpriteHaver(enemy, Point.fromPointLike(enemyData.position));
                                }
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

        requestAnimationFrame(this.renderStage);
    }

    empty()
    {

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
                    onUpdate={this.empty}
                />
            </div>
        );
    }
}
