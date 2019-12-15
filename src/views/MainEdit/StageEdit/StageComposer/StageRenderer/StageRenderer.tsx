import React, { ChangeEvent, Ref } from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, PlayerModel, SpriteModel, ObjectModel, EnemyModel } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
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
            this.renderStage();
        }
    }

    componentDidMount()
    {
        this.handleResize();
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
        if (!this.canvas) return;

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
                    enemy && this.renderSpriteHaver(enemy, Point.fromPointLike(enemyData.position));
                }
            }
        });
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
                    onUpdate={this.renderStage}
                />
            </div>
        );
    }
}
