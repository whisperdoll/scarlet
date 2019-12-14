export interface ProjectModel
{
    name: string;
    objects: ObjectModel[];
};

export type ErrorTypes = "Duplicate name" | "Empty name";

// ADDTYPE //
export type ObjectType = "folder" | "player" | "stage" | "enemy" | "boss" | "sprite" | "script" | "bullet";
export const GameObjectTypes: ObjectType[] = [
    "player",
    "stage",
    "enemy",
    "boss",
    "sprite",
    "script",
    "bullet"
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

export interface PlayerModel extends ObjectModel
{
    type: "player";
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
    fireRate: number;
    damage: number;
};

export interface BossFormModel
{
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
    data: StageData;
}

export interface StageEnemyData
{
    id: number;
    position: {
        x: number,
        y: number
    };
    spawnRate: number;
    spawnAmount: number;
    spawnTime: number;
    lifetime: number;
};

export interface StageData
{
    lengthSeconds: number;
    playerId: number;
    bossId: number;
    enemies: StageEnemyData[]
}