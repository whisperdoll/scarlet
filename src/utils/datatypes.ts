// ADDTYPE
export interface ProjectModel
{
    name: string;
    sprites: SpriteModel[];
    players: PlayerModel[];
    scripts: ScriptModel[];
    enemies: EnemyModel[];
    bullets: BulletModel[];
    bosses: BossModel[];
};

export type ErrorTypes = "Duplicate name" | "Empty name";

export type ObjectType = "folder" | "player" | "stage" | "enemy" | "boss" | "sprite" | "script" | "bullet";

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
};

export interface BulletModel extends ObjectModel
{
    type: "bullet";
    spriteId: number;
    scriptId: number;
};

export interface BossModel extends ObjectModel
{
    type: "boss";
    forms: {
        spriteId: number,
        scriptId: number,
        bulletId: number,
        hp: number
    }[];
}