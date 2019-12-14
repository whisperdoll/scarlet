import React, { ChangeEvent } from 'react';
import './StageComposer.scss';
import { StageModel, ProjectModel, SpriteModel } from '../../../../utils/datatypes';
import ObjectHelper from '../../../../utils/ObjectHelper';
import ObjectSelect from "../../../../components/ObjectSelect/ObjectSelect";
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    onUpdate: (stage: StageModel) => any;
    onBack: () => any;
}

interface State
{
    timeSeconds: number;
}

export default class StageComposer extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        
        this.state = {
            timeSeconds: 0
        };

        this.handleBack = this.handleBack.bind(this);
        this.handleLengthChange = this.handleLengthChange.bind(this);
        this.handlePlayerChange = this.handlePlayerChange.bind(this);
        this.handleBossChange = this.handleBossChange.bind(this);
        this.handleTimelineChange = this.handleTimelineChange.bind(this);
    }

    handleBack()
    {
        this.props.onBack();
    }

    handleLengthChange(e: ChangeEvent<HTMLInputElement>)
    {
        let val = parseFloat(e.currentTarget.value);
        if (isNaN(val))
        {
            val = 60;
        }

        this.props.onUpdate({
            ...this.props.stage,
            data: {
                ...this.props.stage.data,
                lengthSeconds: val
            }
        });
    }

    handlePlayerChange(playerId: number)
    {
        this.props.onUpdate({
            ...this.props.stage,
            data: {
                ...this.props.stage.data,
                playerId: playerId
            }
        });
    }

    handleBossChange(bossId: number)
    {
        this.props.onUpdate({
            ...this.props.stage,
            data: {
                ...this.props.stage.data,
                bossId: bossId
            }
        });
    }

    handleTimelineChange(e: ChangeEvent<HTMLInputElement>)
    {
        const timeSeconds = parseFloat(e.currentTarget.value);
        this.setState((state) =>
        {
            return {
                ...state,
                timeSeconds: timeSeconds
            };
        });
    }

    render()
    {
        return (
            <div className="stageComposer">
                {/* header */}
                <div className="row header">
                    <button onClick={this.handleBack}>&lt; Back</button>
                    <h1>{this.props.stage.name}</h1>
                </div>
                {/* edit stuff */}
                <div className="row edit">
                    {/* left col */}
                    <div className="col stageInfo">
                        <div className="row">
                            <span className="label">Length:</span>
                            <input
                                type="number"
                                onChange={this.handleLengthChange}
                                value={this.props.stage.data.lengthSeconds.toString()}
                            />
                            <span>seconds</span>
                        </div>
                        <div className="row">
                            <span className="label">Player:</span>
                            <ObjectSelect
                                currentObjectId={this.props.stage.data.playerId}
                                objectType="player"
                                onChange={this.handlePlayerChange}
                                project={this.props.project}
                            />
                        </div>
                        <div className="row">
                            <span className="label">Boss:</span>
                            <ObjectSelect
                                currentObjectId={this.props.stage.data.bossId}
                                objectType="boss"
                                onChange={this.handleBossChange}
                                project={this.props.project}
                            />
                        </div>
                        <div className="row">
                            <span>Enemies:</span>
                        </div>
                        <div className="enemyList">
                            enemies here lol
                        </div>
                    </div>
                    {/* stage */}
                    <div className="stagePreview">
                        stage here lol
                    </div>
                    {/* properties */}
                    <div className="properties">
                        properties here lol
                    </div>
                </div>
                {/* timeline */}
                <div className="row timeline">
                    <input
                        type="range"
                        onChange={this.handleTimelineChange}
                        min="0"
                        max={this.props.stage.data.lengthSeconds.toString()}
                        step="0.01"
                        value={this.state.timeSeconds.toString()}
                    />
                </div>
            </div>
        );
    }
}
