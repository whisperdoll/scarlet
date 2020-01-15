import React, { ChangeEvent } from 'react';
import './Player.scss';
import { ProjectModel, StageModel, SpriteModel, BackgroundModel } from '../../utils/datatypes';
import StageRenderer from '../MainEdit/StageEdit/StageComposer/StageRenderer/StageRenderer';
import PureCanvas from '../../components/PureCanvas/PureCanvas';
import { Canvas } from '../../utils/canvas';
import ObjectHelper from '../../utils/ObjectHelper';
import ImageCache from '../../utils/ImageCache';
import Rectangle from '../../utils/rectangle';
import Point from '../../utils/point';
import GameEngine, { GameEntity } from '../../utils/GameEngine';
import * as PIXI from "pixi.js";
import ScriptEngine from '../../utils/ScriptEngine';
import SoundHelper from '../../utils/SoundHelper';

interface Props
{
}

interface State
{
    loading: boolean;
}

export default class PlayerView extends React.PureComponent<Props, State>
{
    private canvas: Canvas | null = null;
    private containerRef: React.RefObject<HTMLDivElement>;
    private gameContainerRef: React.RefObject<HTMLDivElement>;
    private canvasRef : React.RefObject<HTMLCanvasElement>;
    private keyDownMap: Map<string, boolean> = new Map();
    private started: boolean = false;
    private engine: GameEngine;
    private currentStageIndex = 0;
    private animationFrame: number | null = null;
    private renderer: PIXI.Renderer | null = null;
    private entityMap = new Map<GameEntity, PIXI.Sprite>();
    private spritesToDraw = new Map<string, PIXI.Sprite>();
    private stage: PIXI.Container = new PIXI.Container();

    constructor(props: Props)
    {
        super(props);

        this.state = {
            loading: true
        };

        this.containerRef = React.createRef();
        this.gameContainerRef = React.createRef();
        this.canvasRef = React.createRef();
        this.engine = new GameEngine();
    }

    async componentDidMount()
    {
        ScriptEngine.updateCache();
        await SoundHelper.updateCache();
        StageRenderer.createTextureCache(ObjectHelper.project!, () =>
        {
            ImageCache.updateCache(ObjectHelper.project!, () =>
            {
                this.setState(state => ({
                    ...state,
                    loading: false
                }), () =>
                {
                    this.renderer = new PIXI.Renderer({
                        view: this.canvasRef.current!,
                        width: ObjectHelper.project!.settings.stageResolutionX,
                        height: ObjectHelper.project!.settings.stageResolutionY
                    });
                    this.canvas = new Canvas({
                        canvasElement: this.canvasRef.current!,
                        opaque: true,
                        align: {
                            horizontal: false,
                            vertical: false
                        }
                    });
                    this.grabCanvas(this.canvas);
    
                    this.engine.reset(this.currentStage);
                    this.engine.invalidateCache();
                });
            });
        });

        window.addEventListener("resize", this.handleResize);
    }

    componentWillUnmount = () =>
    {
        window.removeEventListener("resize", this.handleResize);
        
        if (this.animationFrame !== null)
        {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    private get currentStage(): StageModel
    {
        const id = ObjectHelper.project!.settings.stageIdOrder[this.currentStageIndex];
        return ObjectHelper.getObjectWithId<StageModel>(id)!;
    }

    start = () =>
    {
        this.started = true;

        this.engine.reset(this.currentStage);

        const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.currentStage.backgroundId);
        if (background)
        {
            const texture = StageRenderer.textureCache.get(background.id)![0];
            const psprite = new PIXI.Sprite(texture);
            psprite.position = new PIXI.Point(0, 0);
            psprite.width = ObjectHelper.project!.settings.stageResolutionX;
            psprite.height = ObjectHelper.project!.settings.stageResolutionY;
            this.stage.addChild(psprite);
        }

        this.animationFrame = requestAnimationFrame(this.advanceFrame);
    }

    renderFrame = (entities: GameEntity[]) =>
    {
        // console.time("==== background");
        // console.timeEnd("==== background");

        for (const entity of entities)
        {
            let psprite: PIXI.Sprite | null = this.entityMap.get(entity) || null;

            if (!psprite)
            {
                console.log("added");
                psprite = new PIXI.Sprite();
                this.entityMap.set(entity, psprite);
                this.stage.addChild(psprite);
            }

            const sprite = ObjectHelper.getObjectWithId<SpriteModel>(entity.spriteId);

            if (sprite)
            {
                const pos = new Point(entity.positionX, entity.positionY);
                const img = ImageCache.getCachedImage(sprite.path);
                const currentCell = Math.floor(entity.age / (sprite.framesPerCell || entity.age)) % sprite.numCells;
                const cellSize = new Point(Math.floor(img.width / sprite.numCells), img.height);
                const offsetPos = pos.minus(cellSize.dividedBy(2));
    
                const texture = StageRenderer.textureCache.get(entity.spriteId)![currentCell];
                psprite.texture = texture;
                psprite.position = offsetPos;
                psprite.alpha = entity.opacity;
                psprite.scale = new PIXI.Point(entity.scaleX, entity.scaleY);
                psprite.tint = entity.tint;
                psprite.visible = entity.alive;
            }
        }

        /*
        this.engine.spritesToDraw.forEach((info) =>
        {
            const sprite = ObjectHelper.getObjectWithName<SpriteModel>(info.name);
            if (sprite && sprite.type === "sprite")
            {
                const pos = new Point(info.x, info.y);
                // console.time("== fetching");
                const img = ImageCache.getCachedImage(sprite.path);
                const currentCell = info.frame;
                const cellSize = new Point(Math.floor(img.width / sprite.numCells), img.height);
                const offsetPos = pos.minus(cellSize.dividedBy(2));
    
                const texture = StageRenderer.textureCache.get(sprite.id)![currentCell];
                const psprite = new PIXI.Sprite(texture);
                psprite.position = offsetPos;
                psprite.alpha = info.opacity;
                psprite.scale = new PIXI.Point(info.scaleX, info.scaleY);
                psprite.tint = info.tint;
                container.addChild(psprite);
                // console.timeEnd("== fetching");
            }
        });*/

        this.renderer!.render(this.stage);
    }

    advanceFrame = () =>
    {
        const results = this.engine.advanceFrame({
            keys: this.keyDownMap,
            playerInvincible: false
        });

        this.renderFrame(results.entities);

        if (this.animationFrame !== null)
        {
            this.animationFrame = requestAnimationFrame(this.advanceFrame);
        }
    }

    grabCanvas = (canvas: Canvas) =>
    {
        canvas.canvas.tabIndex = -1;
        canvas.resize(new Point(ObjectHelper.project!.settings.stageResolutionX, ObjectHelper.project!.settings.stageResolutionY), false);

        canvas.canvas.addEventListener("keydown", (e) =>
        {
            this.keyDownMap.set(e.key.toLowerCase(), true);
        });
        canvas.canvas.addEventListener("keyup", (e) =>
        {
            this.keyDownMap.set(e.key.toLowerCase(), false);

            if (!this.started && e.key.toLowerCase() === ObjectHelper.project!.settings.keyBindings.fire)
            {
                this.start();
            }
        });
        canvas.canvas.addEventListener("blur", () =>
        {
            this.keyDownMap.clear();
        });

        this.handleResize();

        const container = new PIXI.Container();
        
        for (let i = 0; i < ObjectHelper.project!.mainMenu.images.length; i++)
        {
            const image = ObjectHelper.project!.mainMenu.images[i];
            const actualImage = ImageCache.getCachedImage(image.path);
            const texture = StageRenderer.textureCache.get("mainMenu_" + i.toString())![0];
            const psprite = new PIXI.Sprite(texture);
            psprite.position = Point.fromPointLike(image);
            psprite.scale = Point.fromSizeLike(image).dividedBy(Point.fromSizeLike(actualImage));
            container.addChild(psprite);
        }

        this.renderer!.render(container);
    }

    handleResize = () =>
    {
        if (this.containerRef.current && this.canvas)
        {
            const containerSize = Point.fromSizeLike(this.containerRef.current.getBoundingClientRect());
            const stageSize = new Point(
                ObjectHelper.project!.settings.resolutionX,
                ObjectHelper.project!.settings.resolutionY,
            );
            
            const cr = containerSize.ratio;
            const sr = stageSize.ratio;

            if (cr < sr)
            {
                this.gameContainerRef.current!.style.transform = "translate(-50%,-50%) scale(" + (containerSize.x / stageSize.x) + ")";
            }
            else
            {
                this.gameContainerRef.current!.style.transform = "translate(-50%,-50%) scale(" + (containerSize.y / stageSize.y) + ")";
            }
            //this.canvas.scale(ratio, "translate(-50%,-50%)", "");
            /*if ((ratio >= 1 && this.ratio < 1) || (ratio < 1 && this.ratio >= 1))
            {
                this.canvas.pixelated = ratio >= 1;
            }*/
        }
    }

    render = () =>
    {
        return (this.state.loading ? <div className="playerView fullSize" ref={this.containerRef}><h1>Loading...</h1></div> : (
            <div className="playerView fullSize" ref={this.containerRef}>
                <div
                    className="gameContainer"
                    ref={this.gameContainerRef}
                    style={{
                        width: ObjectHelper.project!.settings.resolutionX + "px",
                        height: ObjectHelper.project!.settings.resolutionY + "px"
                    }}
                >
                    <canvas ref={this.canvasRef}></canvas>
                </div>
            </div>
        ));
    }
}
