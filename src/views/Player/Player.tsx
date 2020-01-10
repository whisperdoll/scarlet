import React, { ChangeEvent } from 'react';
import './Player.scss';
import { ProjectModel } from '../../utils/datatypes';
import StageRenderer from '../MainEdit/StageEdit/StageComposer/StageRenderer/StageRenderer';

interface Props
{
}

interface State
{
}

export default class PlayerView extends React.PureComponent<Props, State>
{
    constructor(props: Props)
    {
        super(props);
    }

    render = () =>
    {
        return (
            null
        );
    }
}
