export interface ProjectModel
{
    name: string;
    sprites: SpriteModel[];
    players: PlayerModel[];
};

export type ErrorTypes = "Duplicate name" | "Empty name";

export type ObjectType = "folder" | "player" | "stage" | "enemy" | "boss" | "sprite" | "script";

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
    script: string;
};