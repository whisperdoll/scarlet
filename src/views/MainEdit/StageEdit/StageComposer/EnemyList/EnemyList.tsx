import React from 'react';
import './EnemyList.scss';
import { StageModel, SpriteModel, EnemyModel } from '../../../../../utils/datatypes';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import AnimatedSpriteCanvas from '../../../../../components/AnimatedSpriteCanvas/AnimatedSpriteCanvas';

interface Props
{
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
    }

    handleEnemySelect = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
    {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index as string);
        this.props.onSelectEnemy(index);
    }

    handleEnemyDeselect = () =>
    {
        //this.props.onSelectEnemy(-1);
    }

    spriteForEnemy = (enemyId: number): SpriteModel | null =>
    {
        const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyId);
        if (!enemy) return null;
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(enemy.spriteId);
        return sprite;
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
                        {this.spriteForEnemy(enemy.id) && (
                            <AnimatedSpriteCanvas
                                canvasOptions={{
                                    opaque: false,
                                    pixelated: true
                                }}
                                sprite={this.spriteForEnemy(enemy.id)!}
                                className="sprite"
                            />
                        )}
                        <span>{enemy.instanceName}</span>
                        <span>&nbsp;</span>
                        <span className="enemyType">{"(" + ObjectHelper.getObjectWithId(enemy.id)?.name + ")"}</span>
                    </div>
                ))}
            </div>
        );
    }
}
