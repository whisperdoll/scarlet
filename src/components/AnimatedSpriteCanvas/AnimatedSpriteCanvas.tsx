import React from 'react';
import { Canvas, CanvasOptions } from '../../utils/canvas';
import Point from '../../utils/point';
import { SpriteModel } from '../../utils/datatypes';
import ImageCache from '../../utils/ImageCache';
import Rectangle from '../../utils/rectangle';

interface Props
{
    sprite: SpriteModel;
    canvasOptions: Omit<CanvasOptions, "canvasElement"|"size">;
    className?: string;
    style?: React.CSSProperties
}

interface State
{
}

export default class AnimatedSpriteCanvas extends React.Component<Props, State>
{
    private canvasRef : React.RefObject<HTMLCanvasElement>;
    private canvas: Canvas | null = null;
    private animationFrame: number | null = null;
    private counter: number = 0;
    private lastTime: number = -1;
    private currentFrame: number = 0;
    private unmounted: boolean = false;

    constructor(props: Props)
    {
        super(props);
        this.canvasRef = React.createRef();
    }

    shouldComponentUpdate = (nextProps: Props) =>
    {
        return false;
    }

    componentDidMount = () =>
    {
        this.unmounted = false;

        ImageCache.getImage(this.props.sprite.path, (img) =>
        {
            if (this.unmounted) return;

            const cellWidth = Math.floor(img.width / this.props.sprite.numCells);
    
            this.canvas = new Canvas({
                ...this.props.canvasOptions,
                canvasElement: this.canvasRef.current as HTMLCanvasElement,
                size: new Point(cellWidth, img.height),
                pixelated: false
            });
    
            this.counter = 0;
            this.renderSprite(-1);
        });
    }

    componentWillUnmount = () =>
    {
        this.unmounted = true;
        if (this.animationFrame !== null)
        {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    renderSprite = (time: number) =>
    {
        if (time === -1)
        {
            this.lastTime = time;
            time = 0;
        }

        if (this.props.sprite.framesPerCell > 0)
        {
            this.counter += (time - this.lastTime);
            const goal = this.props.sprite.framesPerCell * (1000 / 60);
    
            if (this.counter >= goal)
            {
                this.counter %= goal;
                this.currentFrame++;
                this.currentFrame %= this.props.sprite.numCells;
            }
        }
        else
        {
            this.currentFrame = 0;
        }

        ImageCache.getImage(this.props.sprite.path, (img) =>
        {
            this.canvas?.clear();
            const cellWidth = Math.floor(img.width / this.props.sprite.numCells);
            this.canvas?.drawCroppedImage(img, new Point(0), new Rectangle(new Point(cellWidth * this.currentFrame, 0), new Point(cellWidth, img.height)));
            this.animationFrame = requestAnimationFrame(this.renderSprite);
            this.lastTime = time;
        });
    }

    render = () =>
    {
        return (<canvas
            className={this.props.className || ""}
            ref={this.canvasRef}
            style={this.props.style}
        />);
    }
}
