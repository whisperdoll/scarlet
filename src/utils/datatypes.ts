import { PointLike } from "./point";

export interface KeyBindings extends Record<string, string>
{
    fire: string;
    bomb: string;
    left: string;
    right: string;
    up: string;
    down: string;
    focus: string;
}

export interface ProjectSettings
{
    keyBindings: KeyBindings;
    stageIdOrder: number[];
    fps: number;
    resolutionX: number;
    resolutionY: number;
    stageResolutionX: number;
    stageResolutionY: number;
}

export interface MainMenu
{
    images: {
        path: string,
        x: number,
        y: number,
        width: number,
        height: number
    }[];
    fontFamily: string;
    fontSize: number;
}

export interface ProjectModel
{
    name: string;
    objects: ObjectModel[];
    settings: ProjectSettings;
    mainMenu: MainMenu;
}

// ADDTYPE //
const stringLitArray = <L extends string>(arr: L[]) => arr;

export const GameObjectTypes = stringLitArray(["player", "stage", "enemy", "boss", "bossForm", "consumable", "sprite", "script", "bullet", "background", "sound"]);
export type ObjectType = (typeof GameObjectTypes)[number];

export interface Hitbox
{
    position: PointLike;
    radius: number;
    consumablesOnly: boolean;
}

export interface ScriptHaver
{
    scriptId: number;
}

export interface SpriteHaver
{
    spriteId: number;
}

export interface ObjectModel
{
    id: number;
    type: ObjectType;
    name: string;
    children?: ObjectModel[];
    hint?: ObjectType;
}

export interface SpriteModel extends ObjectModel
{
    type: "sprite";
    path: string;
    numCells: number;
    framesPerCell: number;
    hitboxes: Hitbox[];
}

export interface ConsumableModel extends ObjectModel
{
    type: "consumable";
    spriteId: number;
    scriptId: number;
}

export interface SoundModel extends ObjectModel
{
    type: "sound";
    path: string;
}

export interface BackgroundModel extends ObjectModel
{
    type: "background";
    path: string;
}

export interface PlayerModel extends ObjectModel
{
    type: "player";
    moveSpeed: number;
    focusedMoveSpeed: number;
    lives: number;
    spriteId: number;
    scriptId: number;
}

export interface ScriptModel extends ObjectModel
{
    type: "script";
    path: string;
}

export interface EnemyModel extends ObjectModel
{
    type: "enemy";
    spriteId: number;
    scriptId: number;
    hp: number;
}

export interface BulletModel extends ObjectModel
{
    type: "bullet";
    spriteId: number;
    scriptId: number;
    damage: number;
}

export interface BossFormModel extends ObjectModel
{
    type: "bossForm";
    lifetime: number;
    spriteId: number;
    scriptId: number;
    hp: number;
}

export interface BossModel extends ObjectModel
{
    type: "boss";
    formIds: number[];
}

export interface StageModel extends ObjectModel
{
    type: "stage";
    backgroundId: number;
    musicId: number;
    playerId: number;
    bossId: number;
    length: number;
    enemies: StageEnemyData[]
    playerSpawnPosition: PointLike;
    bossSpawnPosition: PointLike;
}

export interface StageEnemyData
{
    id: number;
    instanceName: string;
    spawnFrame: number;
    spawnPosition: PointLike;
    spawnRate: number;
    spawnAmount: number;
}