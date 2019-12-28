import React from 'react';
import './BossFormList.scss';
import { StageModel, ProjectModel, SpriteModel, BossModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import PathHelper from '../../../../../utils/PathHelper';
import AnimatedSpriteCanvas from '../../../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    bossId: number;
    onSelectBossForm: (index: number) => any;
}

interface State
{
}

export default class BossFormList extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.handleFormSelect = this.handleFormSelect.bind(this);
        this.handleFormDeselect = this.handleFormDeselect.bind(this);
    }

    handleFormSelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>)
    {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index as string);
        this.props.onSelectBossForm(index);
    }

    handleFormDeselect()
    {
        this.props.onSelectBossForm(-1);
    }

    private spriteForForm(formIndex: number): SpriteModel | null
    {
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.bossId, this.props.project);
        if (!boss) return null;
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(boss.forms[formIndex].spriteId, this.props.project);
        return sprite;
    }

    render()
    {
        return (
            <div className="bossFormList" onClick={this.handleFormDeselect}>
                {ObjectHelper.getObjectWithId<BossModel>(this.props.bossId, this.props.project)?.forms.map((bossForm, i) => (
                    <div
                        className="bossFormItem"
                        onClick={this.handleFormSelect}
                        key={i}
                        data-index={i.toString()}
                    >
                        {this.spriteForForm(i) && (
                            <AnimatedSpriteCanvas
                                canvasOptions={{
                                    opaque: false,
                                    pixelated: true
                                }}
                                sprite={this.spriteForForm(i)!}
                                className="sprite"
                            />
                        )}
                        <span>Form {i.toString()}</span>
                    </div>
                ))}
            </div>
        );
    }
}
