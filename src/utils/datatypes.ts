import { PointLike } from "./point";

export type ObjectMap<T> = { [key: string]: T };

export interface KeyBindings extends ObjectMap<string>
{
    fire: string;
    bomb: string;
    left: string;
    right: string;
    up: string;
    down: string;
    focus: string;
};

export interface ProjectModel
{
    name: string;
    objects: ObjectModel[];
    keyBindings: KeyBindings;
};

export type ErrorTypes = "Duplicate name" | "Empty name";

// ADDTYPE //
export type ObjectType = "folder" | "player" | "stage" | "enemy" | "boss" | "sprite" | "script" | "bullet" | "background";
export const GameObjectTypes: ObjectType[] = [
    "player",
    "stage",
    "enemy",
    "boss",
    "sprite",
    "script",
    "bullet",
    "background"
];

export interface Hitbox
{
    position: PointLike;
    radius: number;
};

export interface ScriptHaver
{
    scriptId: number;
};

export interface SpriteHaver
{
    spriteId: number;
};

export interface BulletHaver
{
    bulletId: number;
};

export interface ObjectModel
{
    id: number;
    type: ObjectType;
    name: string;
    children?: ObjectModel[];
    hint?: ObjectType;
};

export interface SpriteModel extends ObjectModel
{
    type: "sprite";
    path: string;
    numCells: number;
    framesPerCell: number;
    hitboxes: Hitbox[];
};

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
    bulletId: number;
};

export interface ScriptModel extends ObjectModel
{
    type: "script";
    path: string;
};

export interface EnemyModel extends ObjectModel
{
    type: "enemy";
    spriteId: number;
    scriptId: number;
    bulletId: number;
    hp: number;
};

export interface BulletModel extends ObjectModel
{
    type: "bullet";
    spriteId: number;
    scriptId: number;
    damage: number;
};

export interface BossFormModel
{
    lifetime: number;
    spriteId: number;
    scriptId: number;
    bulletId: number;
    hp: number;
};

export interface BossModel extends ObjectModel
{
    type: "boss";
    forms: BossFormModel[]
};

export interface StageModel extends ObjectModel
{
    type: "stage";
    backgroundId: number;
    playerId: number;
    bossId: number;
    length: number;
    enemies: StageEnemyData[]
    size: PointLike;
    playerSpawnPosition: PointLike;
    bossSpawnPosition: PointLike;
};

export interface StageEnemyData
{
    id: number;
    instanceName: string;
    spawnFrame: number;
    spawnPosition: PointLike;
    spawnRate: number;
    spawnAmount: number;
};