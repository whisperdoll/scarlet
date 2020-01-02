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
    onSelectBossForm: (id: number) => any;
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
        const id = parseInt(e.currentTarget.dataset.id as string);
        this.props.onSelectBossForm(id);
    }

    handleFormDeselect()
    {
        this.props.onSelectBossForm(-1);
    }

    private spriteForForm(id: number): SpriteModel | null
    {
        return ObjectHelper.getSubObject(id, "sprite", this.props.project);
    }

    render()
    {
        return (
            <div className="bossFormList" onClick={this.handleFormDeselect}>
                {ObjectHelper.getObjectWithId<BossModel>(this.props.bossId, this.props.project)?.formIds.map((formId, i) => (
                    <div
                        className="bossFormItem"
                        onClick={this.handleFormSelect}
                        key={formId}
                        data-id={formId.toString()}
                    >
                        {this.spriteForForm(formId) && (
                            <AnimatedSpriteCanvas
                                canvasOptions={{
                                    opaque: false,
                                    pixelated: true
                                }}
                                sprite={this.spriteForForm(formId)!}
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
