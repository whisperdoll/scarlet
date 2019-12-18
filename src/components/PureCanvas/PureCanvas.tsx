import React from 'react';
import { Canvas, CanvasOptions } from '../../utils/canvas';
import Point from '../../utils/point';

interface Props
{
    canvasGrabber: (canvas: Canvas) => any;
    canvasOptions: Omit<CanvasOptions, "canvasElement"|"size">;
    size: Point;
    onUpdate: () => any;
}

interface State
{
}

export default class PureCanvas extends React.Component<Props, State>
{
    private canvasRef : React.RefObject<HTMLCanvasElement>;
    private canvas: Canvas | null = null;

    constructor(props: Props)
    {
        super(props);
        this.canvasRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: Props)
    {
        if (this.canvas)
        {
            if (!nextProps.size.equals(this.canvas.size))
            {
                this.canvas.resize(nextProps.size, false);
                this.props.onUpdate();
            }
        }

        return false;
    }

    componentDidMount()
    {
        this.canvas = new Canvas({
            ...this.props.canvasOptions,
            canvasElement: this.canvasRef.current as HTMLCanvasElement,
            size: this.props.size
        });
        this.props.canvasGrabber(this.canvas);
    }

    render()
    {
        return <canvas id="renderer" ref={this.canvasRef}></canvas>;
    }
}
