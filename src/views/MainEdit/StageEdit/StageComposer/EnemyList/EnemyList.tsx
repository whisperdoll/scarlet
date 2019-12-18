import React from 'react';
import './EnemyList.scss';
import { StageModel, ProjectModel, SpriteModel, EnemyModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    onSelectEnemy: (index: number) => any;
}

interface State
{
}

export default class EnemyList extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = {
            selectedNewEnemyId: -1
        };

        this.handleEnemySelect = this.handleEnemySelect.bind(this);
        this.handleEnemyDeselect = this.handleEnemyDeselect.bind(this);
    }

    handleEnemySelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>)
    {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index as string);
        this.props.onSelectEnemy(index);
    }

    handleEnemyDeselect()
    {
        this.props.onSelectEnemy(-1);
    }

    private spritePathForEnemy(enemyId: number): string
    {
        const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyId, this.props.project);
        if (!enemy) return "";
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(enemy.spriteId, this.props.project);
        if (!sprite) return "";
        return sprite.path;
    }

    render()
    {
        return (
            <div className="enemyList" onClick={this.handleEnemyDeselect}>
                {this.props.stage.enemies.map((enemy, i) => (
                    <div
                        className="enemyItem"
                        onClick={this.handleEnemySelect}
                        key={i}
                        data-index={i.toString()}
                    >
                        {this.spritePathForEnemy(enemy.id) && (
                            <img
                                src={this.spritePathForEnemy(enemy.id)}
                                alt={"sprite for " + enemy.instanceName}
                            />
                        )}
                        <span>{enemy.instanceName}</span>
                        <span>&nbsp;</span>
                        <span className="enemyType">{"(" + ObjectHelper.getObjectWithId(enemy.id, this.props.project)?.name + ")"}</span>
                    </div>
                ))}
            </div>
        );
    }
}
