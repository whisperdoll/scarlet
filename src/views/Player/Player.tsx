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
import PathHelper from '../../utils/PathHelper';

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
        this.engine.onAddEntity = this.handleAddEntity;
        this.engine.onUpdateEntity = this.handleUpdateEntity;
        this.engine.onKillEntity = this.handleKillEntity;
    }

    handleAddEntity = (entity: GameEntity) =>
    {
        const psprite = new PIXI.Sprite();
        this.entityMap.set(entity, psprite);
        this.stage.addChild(psprite);

        this.handleUpdateEntity(entity);
    }

    handleUpdateEntity = (entity: GameEntity) =>
    {
        const psprite = this.entityMap.get(entity)!;
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

    handleKillEntity = (entity: GameEntity) =>
    {
        const psprite = this.entityMap.get(entity)!;
        this.stage.removeChild(psprite);
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

                    document.addEventListener("keydown", this.handleDocumentKeyDown);
                    document.addEventListener("keyup", this.handleDocumentKeyUp);
                    document.addEventListener("blur", this.handleDocumentBlur);
            
                    this.handleResize();
                });
            });
        });

        window.addEventListener("resize", this.handleResize);
    }

    handleDocumentKeyDown = (e: KeyboardEvent) =>
    {
        this.keyDownMap.set(e.key.toLowerCase(), true);
    }

    handleDocumentKeyUp = (e: KeyboardEvent) =>
    {
        this.keyDownMap.set(e.key.toLowerCase(), false);

        if (!this.started && e.key.toLowerCase() === ObjectHelper.project!.settings.keyBindings.fire)
        {
            this.start();
        }
    }

    handleDocumentBlur = () =>
    {
        this.keyDownMap.clear();
    }

    componentWillUnmount = () =>
    {
        window.removeEventListener("resize", this.handleResize);

        document.removeEventListener("keydown", this.handleDocumentKeyDown);
        document.removeEventListener("keyup", this.handleDocumentKeyUp);
        document.removeEventListener("blur", this.handleDocumentBlur);
        
        if (this.animationFrame !== null)
        {
            cancelAnimationFrame(this.animationFrame);
        }
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

    private get currentStage(): StageModel
    {
        const id = ObjectHelper.project!.settings.stageIdOrder[this.currentStageIndex];
        return ObjectHelper.getObjectWithId<StageModel>(id)!;
    }

    resetEngine = () =>
    {
        this.entityMap.clear();
        this.stage.removeChildren();

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

        this.engine.reset(this.currentStage);
    }

    start = () =>
    {
        this.started = true;
        this.forceUpdate();
        this.resetEngine();
        this.animationFrame = requestAnimationFrame(this.advanceFrame);
    }

    advanceFrame = () =>
    {
        const results = this.engine.advanceFrame({
            keys: this.keyDownMap,
            playerInvincible: false
        });

        this.renderer!.render(this.stage);

        if (this.animationFrame !== null)
        {
            this.animationFrame = requestAnimationFrame(this.advanceFrame);
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

                    {!this.started && <div className="mainMenu">
                        {ObjectHelper.project!.mainMenu.images.map((image, i) =>
                        (
                            <img
                                key={i}
                                src={PathHelper.resolveObjectFileName(image.path)}
                                style={{
                                    position: "absolute",
                                    left: image.x + "px",
                                    top: image.y + "px",
                                    width: image.width + "px",
                                    height: image.height + "px"
                                }}
                            />
                        ))}
                    </div>}
                    <canvas ref={this.canvasRef}></canvas>
                    <div
                        className="col info"
                        style={{
                            height: ObjectHelper.project!.settings.stageResolutionY + "px"
                        }}
                    >
                        <div>Score: 000000</div>
                        <div>Lives: 3</div>
                        <div>Bomb: 3</div>
                    </div>
                </div>
            </div>
        ));
    }
}
