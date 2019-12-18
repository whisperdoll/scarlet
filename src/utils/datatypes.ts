import { PointLike } from "./point";

export interface ProjectModel
{
    name: string;
    objects: ObjectModel[];
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
    lengthSeconds: number;
    enemies: StageEnemyData[]
    size: PointLike;
    playerSpawnPosition: PointLike;
    bossSpawnPosition: PointLike;
};

export interface StageEnemyData
{
    id: number;
    instanceName: string;
    spawnTime: number;
    spawnPosition: PointLike;
    spawnRate: number;
    spawnAmount: number;
};